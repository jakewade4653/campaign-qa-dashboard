import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppAuthProvider, useAppAuth } from "./contexts/AppAuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import NewWorkflow from "./pages/NewWorkflow";
import WorkflowDetail from "./pages/WorkflowDetail";
import WorkflowLog from "./pages/WorkflowLog";
import TeamSettings from "./pages/TeamSettings";
import Login from "./pages/Login";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/new" component={NewWorkflow} />
        <Route path="/workflow/:id" component={WorkflowDetail} />
        <Route path="/log" component={WorkflowLog} />
        <Route path="/team" component={TeamSettings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function AuthGate() {
  const { session } = useAppAuth();
  if (!session?.authenticated) return <Login />;
  return <Router />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppAuthProvider>
          <TooltipProvider>
            <Toaster />
            <AuthGate />
          </TooltipProvider>
        </AppAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
