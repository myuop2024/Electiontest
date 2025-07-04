import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { WebSocketProvider } from "@/hooks/use-websocket";
import { LoadingProvider, useLoading } from "@/hooks/use-loading";
import CAFFETextLoader from "@/components/ui/caffe-text-loader";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import PollingStations from "@/pages/polling-stations";
import Reports from "@/pages/reports";
import LiveChat from "@/pages/live-chat";
import DocumentCapture from "@/pages/document-capture";
import RouteNavigation from "@/pages/route-navigation";
import TrainingCenter from "@/pages/training-center";
import TrainingManagement from "@/pages/TrainingManagement";
import EnhancedTrainingManagement from "@/pages/EnhancedTrainingManagement";
import Analytics from "@/pages/analytics";
import QRScanner from "@/pages/qr-scanner";
import CheckIn from "@/pages/check-in";
import EmergencyAlert from "@/pages/emergency-alert";
import Settings from "@/pages/settings";
import UnifiedAdmin from "@/pages/unified-admin";
import AdminPanel from "@/pages/admin-panel";
import AdminSettings from "@/pages/AdminSettings";
import AdminDiditSettings from "@/pages/AdminDiditSettings"; // Import new page
import IncidentReporting from "@/pages/incident-reporting";
import ObserverAssignments from "@/pages/observer-assignments";
import RealTimeAnalytics from "@/pages/real-time-analytics";
import AIAnalytics from "@/pages/ai-analytics";
import IncidentManagement from "@/pages/incident-management";
import FormBuilder from "@/pages/form-builder";
import SheetsIntegration from "@/pages/sheets-integration";
import LocationTracking from "@/pages/location-tracking";
import AIIncidentClassifier from "@/pages/ai-incident-classifier";
import EmergencyManagement from "@/pages/emergency-management";
import PollingStationManagement from "@/pages/polling-station-management";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import FloatingActionButton from "@/components/layout/floating-action-button";
import LiveChatWidget from "@/components/layout/live-chat-widget";
import Redirect from "@/components/redirect";
import { useAuth } from "@/hooks/use-auth";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <FloatingActionButton />
      <LiveChatWidget />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <ProtectedLayout>
          <Dashboard />
        </ProtectedLayout>
      </Route>
      <Route path="/polling-stations">
        <ProtectedLayout>
          <PollingStations />
        </ProtectedLayout>
      </Route>
      <Route path="/reports">
        <ProtectedLayout>
          <Reports />
        </ProtectedLayout>
      </Route>
      <Route path="/live-chat">
        <ProtectedLayout>
          <LiveChat />
        </ProtectedLayout>
      </Route>
      <Route path="/document-capture">
        <ProtectedLayout>
          <DocumentCapture />
        </ProtectedLayout>
      </Route>
      <Route path="/route-navigation">
        <ProtectedLayout>
          <RouteNavigation />
        </ProtectedLayout>
      </Route>
      <Route path="/training-center">
        <ProtectedLayout>
          <TrainingCenter />
        </ProtectedLayout>
      </Route>
      <Route path="/admin-training">
        <ProtectedLayout>
          <TrainingManagement />
        </ProtectedLayout>
      </Route>
      <Route path="/admin/enhanced-training">
        <ProtectedLayout>
          <EnhancedTrainingManagement />
        </ProtectedLayout>
      </Route>
      <Route path="/admin/training">
        <ProtectedLayout>
          <TrainingManagement />
        </ProtectedLayout>
      </Route>
      <Route path="/analytics">
        <ProtectedLayout>
          <Analytics />
        </ProtectedLayout>
      </Route>
      <Route path="/check-in">
        <ProtectedLayout>
          <CheckIn />
        </ProtectedLayout>
      </Route>
      <Route path="/emergency-alert">
        <ProtectedLayout>
          <EmergencyAlert />
        </ProtectedLayout>
      </Route>
      <Route path="/qr-scanner">
        <ProtectedLayout>
          <QRScanner />
        </ProtectedLayout>
      </Route>
      <Route path="/settings">
        <ProtectedLayout>
          <Settings />
        </ProtectedLayout>
      </Route>
      <Route path="/admin">
        <ProtectedLayout>
          <UnifiedAdmin />
        </ProtectedLayout>
      </Route>
      <Route path="/admin-panel">
        <ProtectedLayout>
          <AdminPanel />
        </ProtectedLayout>
      </Route>
      <Route path="/admin-settings">
        <ProtectedLayout>
          <AdminSettings />
        </ProtectedLayout>
      </Route>
      {/* New Route for Didit Settings */}
      <Route path="/admin/didit-settings">
        <ProtectedLayout>
          <AdminDiditSettings />
        </ProtectedLayout>
      </Route>
      <Route path="/training-management">
        <ProtectedLayout>
          <TrainingManagement />
        </ProtectedLayout>
      </Route>
      <Route path="/polling-station-management">
        <ProtectedLayout>
          <PollingStationManagement />
        </ProtectedLayout>
      </Route>
      <Route path="/incident-reporting">
        <ProtectedLayout>
          <IncidentReporting />
        </ProtectedLayout>
      </Route>
      <Route path="/observer-assignments">
        <ProtectedLayout>
          <ObserverAssignments />
        </ProtectedLayout>
      </Route>
      <Route path="/real-time-analytics">
        <ProtectedLayout>
          <RealTimeAnalytics />
        </ProtectedLayout>
      </Route>
      <Route path="/ai-analytics">
        <ProtectedLayout>
          <AIAnalytics />
        </ProtectedLayout>
      </Route>
      <Route path="/incident-management">
        <ProtectedLayout>
          <IncidentManagement />
        </ProtectedLayout>
      </Route>
      <Route path="/form-builder">
        <ProtectedLayout>
          <FormBuilder />
        </ProtectedLayout>
      </Route>
      <Route path="/sheets-integration">
        <ProtectedLayout>
          <SheetsIntegration />
        </ProtectedLayout>
      </Route>
      <Route path="/location-tracking">
        <ProtectedLayout>
          <LocationTracking />
        </ProtectedLayout>
      </Route>
      <Route path="/ai-classifier">
        <ProtectedLayout>
          <AIIncidentClassifier />
        </ProtectedLayout>
      </Route>
      <Route path="/emergency-management">
        <ProtectedLayout>
          <EmergencyManagement />
        </ProtectedLayout>
      </Route>
      <Route path="*">
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}

function AppContent() {
  const { isLoading } = useLoading();
  const [initialLoad, setInitialLoad] = useState(true);

  const handleLoadComplete = () => {
    setInitialLoad(false);
  };

  if (initialLoad || isLoading) {
    return <CAFFETextLoader onComplete={handleLoadComplete} />;
  }

  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router />
      </WebSocketProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoadingProvider>
          <AppContent />
          <Toaster />
        </LoadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;