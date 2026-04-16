import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { examDate, subjects, difficulty, dailyHours } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are an expert study planner AI. Generate a detailed, personalized weekly study schedule.
Return ONLY valid JSON with this exact structure:
{
  "plan": [
    {
      "day": "Monday",
      "tasks": [
        { "subject": "Physics", "topic": "Specific topic name", "duration": "1.5 hrs" }
      ]
    }
  ],
  "tips": ["tip1", "tip2"]
}
Cover all 7 days (Monday-Sunday). Distribute subjects evenly. Each day's total study time should be approximately the daily hours specified. Be specific with topic names.`;

    const userPrompt = `Create a study plan with these details:
- Today's date: ${today}
- Exam date: ${examDate || "in 30 days"}
- Subjects: ${subjects || "General"}
- Difficulty level: ${difficulty || "medium"}
- Daily study hours available: ${dailyHours || 4}

Generate a comprehensive weekly schedule that prioritizes harder subjects and includes review sessions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_study_plan",
              description: "Generate a structured weekly study plan",
              parameters: {
                type: "object",
                properties: {
                  plan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        tasks: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              subject: { type: "string" },
                              topic: { type: "string" },
                              duration: { type: "string" },
                            },
                            required: ["subject", "topic", "duration"],
                          },
                        },
                      },
                      required: ["day", "tasks"],
                    },
                  },
                  tips: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["plan", "tips"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_study_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let planData;

    if (toolCall?.function?.arguments) {
      planData = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing content
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    return new Response(JSON.stringify(planData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
