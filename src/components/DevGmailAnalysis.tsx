import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isDevModeEnabled } from "@/services/devModeService";
import { fetchDevGmailAnalysis, fetchDevDeepGmailAnalysis, DevGmailAnalysisData, DeepGmailAnalysisResult } from "@/services/googleService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Link, Lock, UserCheck, Search, MailWarning, ThumbsUp, ThumbsDown, Megaphone } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function DevGmailAnalysis() {
  const [devData, setDevData] = useState<DevGmailAnalysisData | null>(null);
  const [deepDevData, setDeepDevData] = useState<DeepGmailAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDev = isDevModeEnabled();




  useEffect(() => {
    if (!isDev) {
      setLoading(false);
      return;
    }

    const loadDevData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.provider_token;

        if (!accessToken) {
          throw new Error("Google access token not found. Please ensure you are logged in via Google OAuth.");
        }

        const [devAnalysis, deepDevAnalysis] = await Promise.all([
          fetchDevGmailAnalysis(accessToken),
          fetchDevDeepGmailAnalysis(accessToken)
        ]);
        setDevData(devAnalysis);
        setDeepDevData(deepDevAnalysis);
      } catch (e: any) {
        setError(e.message || "Failed to fetch developer analysis data.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadDevData();
  }, [isDev]);

  if (!isDev) {
    return null;
  }

  if (loading) {
    return (
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="tahoe-text flex items-center gap-3">
            <Search className="w-6 h-6 text-cyan-400" />
            Developer Gmail Analysis
          </CardTitle>
          <CardDescription className="tahoe-text">
            Performing deep analysis of Gmail data... This might take a moment.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-cyan-400 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="card-hover glass-card-lg border-red-500/40">
        <CardHeader>
          <CardTitle className="tahoe-text flex items-center gap-3 text-red-400">
            <AlertCircle className="w-6 h-6" />
            Analysis Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="tahoe-text text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-white tahoe-title flex items-center gap-3">
            <Search className="w-7 h-7" /> Developer Deep Gmail Analysis ({deepDevData?.totalAnalyzed || 0} messages analyzed)
        </h2>

        {/* Connected Apps */}
        <Card className="card-hover glass-card-lg">
            <CardHeader>
                <CardTitle className="tahoe-text flex items-center gap-3">
                    <UserCheck className="w-6 h-6 text-cyan-400" />
                    Connected Apps
                </CardTitle>
                <CardDescription className="tahoe-text">Apps granted access to the Google account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {devData?.connectedApps.map((app, i) => (
                    <div key={i} className="flex justify-between items-center p-3 glass rounded-lg">
                        <span className="font-medium tahoe-text">{app.name}</span>
                        <Badge variant="outline">{app.date}</Badge>
                    </div>
                ))}
                {devData?.connectedApps.length === 0 && <p className="tahoe-text text-white/60">No connected app notifications found.</p>}
            </CardContent>
        </Card>

        {/* Visited Websites */}
        <Card className="card-hover glass-card-lg">
            <CardHeader>
                <CardTitle className="tahoe-text flex items-center gap-3">
                    <Link className="w-6 h-6 text-cyan-400" />
                    Registered Services (Visited Websites)
                </CardTitle>
                <CardDescription className="tahoe-text">Domains extracted from account verification emails.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {devData?.visitedWebsites.map((site, i) => (
                    <Badge key={i} variant="secondary" className="justify-between">
                        {site.domain} <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-slate-600">{site.count}</span>
                    </Badge>
                ))}
                 {devData?.visitedWebsites.length === 0 && <p className="tahoe-text text-white/60">No registration emails found.</p>}
            </CardContent>
        </Card>

        {/* Suspicious Activity */}
        <Card className="card-hover glass-card-lg">
            <CardHeader>
                <CardTitle className="tahoe-text flex items-center gap-3">
                    <Lock className="w-6 h-6 text-cyan-400" />
                    Suspicious Activity Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold tahoe-text mb-2">Failed SPF/DKIM Authentication</h4>
                     <div className="space-y-2">
                        {devData?.suspiciousActivity.failedAuthMessages.map((msg, i) => (
                            <div key={i} className="p-3 glass rounded-lg text-xs">
                                <p className="font-mono text-orange-400">From: {msg.from}</p>
                                <p className="font-mono text-white/80">Subject: {msg.subject}</p>
                                <p className="font-mono text-red-400 mt-1">Reason: {msg.reason}</p>
                            </div>
                        ))}
                        {devData?.suspiciousActivity.failedAuthMessages.length === 0 && <p className="tahoe-text text-white/60 text-sm">No recent emails with failed authentication headers found.</p>}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold tahoe-text mb-2">Google Sign-in Alerts</h4>
                     <div className="space-y-2">
                        {devData?.suspiciousActivity.loginAlerts.map((alert, i) => (
                             <div key={i} className="flex justify-between items-center p-3 glass rounded-lg text-sm">
                                <div>
                                    <p className="font-medium text-white">{alert.device}</p>
                                    <p className="text-white/70">{alert.location}</p>
                                </div>
                                <Badge className="font-mono">{alert.ip}</Badge>
                            </div>
                        ))}
                        {devData?.suspiciousActivity.loginAlerts.length === 0 && <p className="tahoe-text text-white/60 text-sm">No Google sign-in alerts found.</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold tahoe-text mb-2">Extracted Links for Analysis</h4>
                    <p className="text-sm tahoe-text text-white/60 mb-2">Links are extracted for analysis. A real implementation would check these against the Google Safe Browsing API, but this requires a developer API key. No key is configured by default.</p>
                     <div className="space-y-2 max-h-48 overflow-y-auto p-2 glass rounded-lg">
                        {devData?.suspiciousActivity.extractedLinks.map((link, i) => (
                           <p key={i} className="text-xs font-mono text-cyan-300 truncate" title={link.link}>
                               {link.link}
                           </p>
                        ))}
                        {devData?.suspiciousActivity.extractedLinks.length === 0 && <p className="tahoe-text text-white/60 text-sm">No links found in recent emails.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
