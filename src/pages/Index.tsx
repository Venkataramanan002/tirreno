
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import UserBehavior from "@/components/UserBehavior";
import ThreatDetection from "@/components/ThreatDetection";
import SecurityEvents from "@/components/SecurityEvents";
import UserManagement from "@/components/UserManagement";
import SecurityScenarioAnalysis from "@/components/SecurityScenarioAnalysis";
import DataValidationReportComponent from "@/components/DataValidationReport";
import DevGmailAnalysis from "@/components/DevGmailAnalysis";
import { Shield, RefreshCw } from "lucide-react";
import AccountSwitcher from "@/components/AccountSwitcher";
import AccountDropdown from "@/components/AccountDropdown";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { userDataService } from "@/services/userDataService";
import { isDevModeEnabled, initDevMode } from "@/services/devModeService";
import { DataValidationReportService } from "@/services/dataValidationReport";
import { dataAggregationService } from "@/services/dataAggregationService";
import { initializeFromOAuthProfile } from "@/services/localAccountService";




const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataValidationReport, setDataValidationReport] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{ name?: string; picture?: string }>({});
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    // Initialize dev mode theme
    initDevMode();
    setDevMode(isDevModeEnabled());
    
    // Initialize accounts from localStorage on page load
    initializeFromOAuthProfile();
    
    // Get user profile data from localStorage
    try {
      const googleDataRaw = localStorage.getItem('google_real_data');
      const oauthRaw = localStorage.getItem('oauth_profile');
      if (googleDataRaw) {
        const googleData = JSON.parse(googleDataRaw);
        setUserProfile({
          name: googleData?.profile?.name,
          picture: googleData?.profile?.picture
        });
      } else if (oauthRaw) {
        const oauth = JSON.parse(oauthRaw);
        setUserProfile({
          name: oauth?.name,
          picture: oauth?.picture
        });
      }
    } catch {}
    
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

  useEffect(() => {
    const ensureProfile = async () => {
      if (!user) return;
      const emailCandidate = user.email || (() => {
        try {
          const raw = localStorage.getItem('oauth_profile');
          if (raw) return JSON.parse(raw).email as string | undefined;
        } catch {}
        return undefined;
      })() || undefined;
      if (!emailCandidate) return;
      try {
        await supabase.from('profiles').upsert({
          user_id: user.id,
          email: emailCandidate,
        }, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('Failed to upsert profile', e);
      }
    };
    ensureProfile();
  }, [user]);

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

  const handleRefresh = () => {
    setRefreshKey(String(Date.now()));
  };

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center tahoe-glass px-12 py-16">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-white/20 border-t-blue-400 mx-auto mb-6 tahoe-icon"></div>
          <p className="tahoe-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative z-20">
      {/* Header */}
      <header className="sticky top-0 z-50 tahoe-nav border-b-0 mb-6">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400/30 to-purple-500/30 backdrop-blur-xl border border-white/20 tahoe-icon">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="tahoe-title">Email Threat Analysis</h1>
                <p className="tahoe-text mt-0.5">Advanced Threat Intelligence & Security Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {devMode && (
                <span className="dev-badge">DEV MODE</span>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <AccountSwitcher />
              <AccountDropdown
                userEmail={user.email || ''}
                userName={userProfile.name}
                userPicture={userProfile.picture}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-10">
        <Tabs defaultValue="scenario" className="space-y-8">
          <TabsList className="w-full flex flex-nowrap overflow-x-auto p-2">
            <TabsTrigger value="scenario">
              Live Scenario
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="behavior">
              User Behavior
            </TabsTrigger>
            <TabsTrigger value="threats">
              Threat Detection
            </TabsTrigger>
            <TabsTrigger value="events">
              Security Events
            </TabsTrigger>
            <TabsTrigger value="users">
              User Management
            </TabsTrigger>
            <TabsTrigger value="report">
              Data Report
            </TabsTrigger>
            {devMode && (
              <TabsTrigger value="dev-analysis">
                Dev Analysis
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="scenario">
            <SecurityScenarioAnalysis refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="behavior">
            <UserBehavior refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="threats">
            <ThreatDetection refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="events">
            <SecurityEvents refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="report">
            <DataValidationReportComponent initialReport={dataValidationReport} refreshKey={refreshKey} />
          </TabsContent>

          {devMode && (
            <TabsContent value="dev-analysis">
              <DevGmailAnalysis />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
