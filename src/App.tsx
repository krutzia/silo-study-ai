import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StudyPlan from "./pages/StudyPlan";
import FocusTimer from "./pages/FocusTimer";
import FriendsPage from "./pages/Friends";
import LeaderboardPage from "./pages/Leaderboard";
import AnalyticsPage from "./pages/Analytics";
import GoalsPage from "./pages/Goals";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AIChatWidget } from "./components/AIChatWidget";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/study-plan" element={<ProtectedRoute><StudyPlan /></ProtectedRoute>} />
              <Route path="/focus-timer" element={<ProtectedRoute><FocusTimer /></ProtectedRoute>} />
              <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIChatWidget />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
