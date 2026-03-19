import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import RoutineSetup from "@/pages/setup";
import { Layout } from "@/components/layout";
import { AppProvider, useApp } from "@/lib/store";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useApp();
  
  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  const { user } = useApp();

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login">
          {user ? <Redirect to="/dashboard" /> : <AuthPage type="login" />}
        </Route>
        <Route path="/register">
          {user ? <Redirect to="/dashboard" /> : <AuthPage type="register" />}
        </Route>
        
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/setup">
          <ProtectedRoute component={RoutineSetup} />
        </Route>
        <Route path="/analytics">
          <ProtectedRoute component={Analytics} /> 
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
