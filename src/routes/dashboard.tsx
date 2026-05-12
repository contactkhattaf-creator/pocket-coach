import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/mobile/MobileShell";
import { LoadingScreen } from "@/components/LoadingScreen";

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
    return <LoadingScreen />;
  }

  return (
    <DashboardContext.Provider value={{ user, refreshData }}>
      <MobileShell>
        <Outlet />
      </MobileShell>
    </DashboardContext.Provider>
  );
}
