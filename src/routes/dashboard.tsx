import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MoniqLogo } from "@/components/MoniqLogo";

interface DashboardContextType {
  user: { id: string; email?: string } | null;
  refreshData: () => void;
}

export const DashboardContext = createContext<DashboardContextType>({
  user: null,
  refreshData: () => {},
});

export const useDashboard = () => useContext(DashboardContext);

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refreshData = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <MoniqLogo size={48} className="mx-auto text-violet-bright animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ user, refreshData }}>
      <DashboardSidebar>
        <Outlet />
      </DashboardSidebar>
    </DashboardContext.Provider>
  );
}
