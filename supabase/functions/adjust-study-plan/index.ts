import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all incomplete tasks scheduled before today (overdue)
    const today = new Date().toISOString().split("T")[0];
    const { data: overdue, error: overdueErr } = await supabase
      .from("study_tasks")
      .select("id, subject, topic, duration_minutes, scheduled_date")
      .eq("user_id", user.id)
      .eq("completed", false)
      .lt("scheduled_date", today)
      .order("scheduled_date", { ascending: true });

    if (overdueErr) throw overdueErr;

    if (!overdue || overdue.length === 0) {
      return new Response(
        JSON.stringify({ rescheduled: 0, message: "You're on track! No overdue tasks." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch upcoming tasks (today + future) to know existing daily load
    const { data: upcoming } = await supabase
      .from("study_tasks")
      .select("scheduled_date, duration_minutes")
      .eq("user_id", user.id)
      .eq("completed", false)
      .gte("scheduled_date", today);

    // Build current load per day
    const loadByDay: Record<string, number> = {};
    (upcoming || []).forEach((t) => {
      loadByDay[t.scheduled_date] = (loadByDay[t.scheduled_date] || 0) + t.duration_minutes;
    });

    // Ask AI for a redistribution plan
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const overdueList = overdue.map((t) => ({
      id: t.id,
      subject: t.subject,
      topic: t.topic,
      duration_minutes: t.duration_minutes,
      original_date: t.scheduled_date,
    }));

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a study planner assistant. Redistribute overdue study tasks across the next 7 days, " +
              "balancing daily load (target ~240 min/day total including existing load). " +
              "Never schedule a task in the past. Today is " + today + ". " +
              "Existing upcoming load (minutes per date): " + JSON.stringify(loadByDay),
          },
          {
            role: "user",
            content:
              "Reschedule these overdue tasks to dates between " + today +
              " and 7 days from now. Tasks: " + JSON.stringify(overdueList),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "reschedule_tasks",
              description: "Return new dates for each overdue task.",
              parameters: {
                type: "object",
                properties: {
                  reschedules: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        new_date: { type: "string", description: "YYYY-MM-DD" },
                      },
                      required: ["id", "new_date"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["reschedules", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "reschedule_tasks" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit hit. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      throw new Error("AI service unavailable");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return reschedules");

    const args = JSON.parse(toolCall.function.arguments);
    const reschedules: { id: string; new_date: string }[] = args.reschedules || [];

    // Validate dates aren't in the past, then update
    const validIds = new Set(overdue.map((t) => t.id));
    const todayDate = new Date(today);
    let updated = 0;

    for (const r of reschedules) {
      if (!validIds.has(r.id)) continue;
      const d = new Date(r.new_date);
      if (isNaN(d.getTime()) || d < todayDate) continue;

      const { error } = await supabase
        .from("study_tasks")
        .update({ scheduled_date: r.new_date })
        .eq("id", r.id)
        .eq("user_id", user.id);
      if (!error) updated++;
    }

    return new Response(
      JSON.stringify({
        rescheduled: updated,
        total_overdue: overdue.length,
        summary: args.summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("adjust-study-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
