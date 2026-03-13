import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminPanel from "./pages/AdminPanel";
import LandingPage from "./pages/LandingPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import RegistrationPage from "./pages/RegistrationPage";
import StudentDashboard from "./pages/StudentDashboard";
import SubscriptionExpiredPage from "./pages/SubscriptionExpiredPage";

type AppState =
  | "loading"
  | "landing"
  | "registration"
  | "pending"
  | "dashboard"
  | "expired"
  | "admin";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [appState, setAppState] = useState<AppState>("loading");

  const determineState = useCallback(async () => {
    if (!actor) return;
    try {
      const [isAdmin, isRegistered, isApproved, isActive] = await Promise.all([
        actor.isCallerAdmin(),
        actor.isRegistered(),
        actor.isCallerApproved(),
        actor.isSubscriptionActive(),
      ]);

      if (isAdmin) {
        setAppState("admin");
      } else if (!isRegistered) {
        setAppState("registration");
      } else if (!isApproved) {
        setAppState("pending");
      } else if (!isActive) {
        setAppState("expired");
      } else {
        setAppState("dashboard");
      }
    } catch (e) {
      console.error("Failed to determine app state", e);
      setAppState("registration");
    }
  }, [actor]);

  useEffect(() => {
    if (isInitializing) return;
    if (!identity) {
      setAppState("landing");
      return;
    }
    if (!isFetching && actor) {
      determineState();
    }
  }, [identity, isInitializing, actor, isFetching, determineState]);

  if (appState === "loading" || isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <>
      <div className="min-h-dvh bg-background flex flex-col">
        {appState === "landing" && <LandingPage />}
        {appState === "registration" && (
          <RegistrationPage onSubmitted={() => setAppState("pending")} />
        )}
        {appState === "pending" && <PendingApprovalPage />}
        {appState === "dashboard" && <StudentDashboard />}
        {appState === "expired" && (
          <SubscriptionExpiredPage onRenewed={() => setAppState("pending")} />
        )}
        {appState === "admin" && <AdminPanel />}
      </div>
      <Toaster richColors position="top-center" />
    </>
  );
}
