
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import UserBehavior from "@/components/UserBehavior";
import ThreatDetection from "@/components/ThreatDetection";
import SecurityEvents from "@/components/SecurityEvents";
import UserManagement from "@/components/UserManagement";
import SecurityScenarioAnalysis from "@/components/SecurityScenarioAnalysis";
import DataValidationReportComponent from "@/components/DataValidationReport";
import { Shield, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { userDataService } from "@/services/userDataService";
import { DataValidationReportService } from "@/services/dataValidationReport";
import { dataAggregationService } from "@/services/dataAggregationService";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataValidationReport, setDataValidationReport] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Generate data validation report when user is available
  useEffect(() => {
    if (user) {
      const generateReport = async () => {
        try {
          const enrichmentData = await dataAggregationService.getUnifiedEnrichmentData();
          if (enrichmentData) {
            const report = await DataValidationReportService.generateRealReport();
            setDataValidationReport(report);
          }
        } catch (error) {
          console.error('Failed to generate data validation report:', error);
        }
      };
      generateReport();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg glow-cyan">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Email Threat Analysis</h1>
                <p className="text-sm text-gray-400">Advanced Threat Intelligence & Security Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/70 rounded-lg border border-gray-700 glow-cyan">
                <User className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-300 font-mono">{user.email}</span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="scenario" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-gray-900/50 border border-gray-700">
            <TabsTrigger value="scenario" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:glow-cyan">
              Live Scenario
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:glow-cyan">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="behavior" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:glow-cyan">
              User Behavior
            </TabsTrigger>
            <TabsTrigger value="threats" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:glow-cyan">
              Threat Detection
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:glow-cyan">
              Security Events
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:glow-cyan">
              User Management
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:glow-cyan">
              Data Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scenario">
            <SecurityScenarioAnalysis />
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="behavior">
            <UserBehavior />
          </TabsContent>

          <TabsContent value="threats">
            <ThreatDetection />
          </TabsContent>

          <TabsContent value="events">
            <SecurityEvents />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="report">
            {dataValidationReport ? (
              <DataValidationReportComponent initialReport={dataValidationReport} />
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-slate-400">Generating data validation report...</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
