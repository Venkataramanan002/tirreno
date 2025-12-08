
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Bot, User, Clock, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { userDataService, UserProfile, SecurityEvent, ThreatIntelligence, BotDetection } from "@/services/userDataService";

interface Props {
  refreshKey?: string;
}

// Interfaces are now imported from userDataService

const SecurityScenarioAnalysis = ({ refreshKey }: Props) => {
  const [userSession, setUserSession] = useState<UserProfile | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence[]>([]);
  const [botDetection, setBotDetection] = useState<BotDetection[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");

  // Helper functions moved to userDataService

  useEffect(() => {
    const initializeData = async () => {
      setIsAnalyzing(true);
      setAnalysisStep("Initializing user data...");
      
      try {
        const profile = await userDataService.initializeUserData();
        if (profile) {
          setUserSession(profile);
          setSecurityEvents(userDataService.getSecurityEvents());
          setThreatIntelligence(userDataService.getThreatIntelligence());
          setBotDetection(userDataService.getBotDetection());
        }
      } catch (error) {
        console.error('Failed to initialize user data:', error);
      } finally {
        setIsAnalyzing(false);
        setAnalysisStep("");
      }
    };

    initializeData();
  }, [refreshKey]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500";
      case "high": return "text-red-400";
      case "medium": return "text-orange-400";
      default: return "text-yellow-400";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-700 text-white">CRITICAL</Badge>;
      case "high":
        return <Badge className="bg-red-600 text-white">HIGH</Badge>;
      case "medium":
        return <Badge className="bg-orange-600 text-white">MEDIUM</Badge>;
      default:
        return <Badge className="bg-yellow-600 text-white">LOW</Badge>;
    }
  };

  if (!userSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="tahoe-text">Loading user session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scenario Overview */}
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 tahoe-text">
            <Shield className="w-5 h-5 text-cyan-400" />
            Live Security Scenario Analysis
            {isAnalyzing && (
              <div className="flex items-center ml-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2"></div>
                <span className="text-sm text-cyan-400">Analyzing...</span>
              </div>
            )}
          </CardTitle>
          <CardDescription className="tahoe-text">
            Real-time analysis of user session: {userSession.email} (Risk Score: {userSession.riskScore}/100)
            {isAnalyzing && analysisStep && (
              <div className="mt-2 text-xs text-cyan-400">{analysisStep}</div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-5 glass rounded-xl border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span className="text-sm tahoe-text">User Session</span>
              </div>
              <div className="tahoe-text font-medium">{userSession.email}</div>
              <div className="text-sm tahoe-text">{userSession.deviceType}</div>
            </div>
            <div className="p-5 glass rounded-xl border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-sm tahoe-text">Primary Location</span>
              </div>
              <div className="tahoe-text font-medium">{userSession.location}</div>
              <div className="text-sm tahoe-text">{userSession.ipAddress}</div>
            </div>
            <div className="p-5 glass rounded-xl border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm tahoe-text">Risk Assessment</span>
              </div>
              <div className="text-red-400 font-bold text-lg">{userSession.riskScore}/100</div>
              <div className="text-sm text-red-300">{userSession.riskLevel}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 tahoe-text">
            <Clock className="w-5 h-5 text-cyan-400" />
            Security Event Timeline
          </CardTitle>
          <CardDescription className="tahoe-text">
            Chronological sequence of security events and detections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.map((event, index) => (
              <div key={event.id} className="relative pl-8 pb-4">
                {/* Timeline line */}
                {index < securityEvents.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-white/20"></div>
                )}
                
                {/* Timeline dot */}
                <div className={`absolute left-2 top-2 w-2 h-2 rounded-full ${
                  event.severity === 'high' ? 'bg-red-400' : 
                  event.severity === 'medium' ? 'bg-orange-400' : 'bg-green-400'
                }`}></div>
                
                <div className="glass rounded-xl p-5 ml-4 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="tahoe-text font-medium">{event.eventType}</div>
                      <div className="text-sm tahoe-text">{new Date(event.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(event.severity)}
                      <Badge className={`${
                        event.status === 'blocked' ? 'bg-red-700' :
                        event.status === 'flagged' ? 'bg-orange-700' :
                        event.status === 'success' ? 'bg-green-700' : 'bg-blue-700'
                      }`}>
                        {event.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="tahoe-text mb-3">{event.details}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="tahoe-text">IP:</span>
                      <span className="tahoe-text ml-2 font-mono">{event.ipAddress}</span>
                    </div>
                    <div>
                      <span className="tahoe-text">Location:</span>
                      <span className="tahoe-text ml-2">{event.location}</span>
                    </div>
                    {event.userId && (
                      <div>
                        <span className="tahoe-text">User ID:</span>
                        <span className="tahoe-text ml-2 font-mono">{event.userId}</span>
                      </div>
                    )}
                    {event.riskScore && (
                      <div>
                        <span className="tahoe-text">Risk Score:</span>
                        <span className={`ml-2 font-bold ${getSeverityColor('high')}`}>{event.riskScore}/100</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-hover glass-card-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tahoe-text">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Threat Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {threatIntelligence.map((threat, index) => (
              <div key={index} className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-red-400 font-bold">Malicious IP Detected</div>
                    <div className="tahoe-text font-mono">{threat.ipAddress}</div>
                  </div>
                  <Badge className="bg-red-700">
                    {threat.confidenceScore}% Confidence
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="tahoe-text">Threat Type:</span>
                    <span className="tahoe-text ml-2">{threat.threatType}</span>
                  </div>
                  <div>
                    <span className="tahoe-text">Last Seen:</span>
                    <span className="tahoe-text ml-2">{threat.lastSeen}</span>
                  </div>
                  <div>
                    <span className="tahoe-text">Campaigns:</span>
                    <span className="tahoe-text ml-2">{threat.associatedCampaigns.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-hover glass-card-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tahoe-text">
              <Bot className="w-5 h-5 text-orange-400" />
              Bot Detection Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {botDetection.map((bot, index) => (
              <div key={index} className="p-4 bg-orange-900/20 border border-orange-700 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-orange-400 font-bold">{bot.botType}</div>
                    <div className="tahoe-text font-mono">{bot.ipAddress}</div>
                  </div>
                  <Badge className="bg-orange-700">
                    {bot.botScore}/100 Bot Score
                  </Badge>
                </div>
                <div className="space-y-2 text-sm mb-3">
                  <div>
                    <span className="tahoe-text">Confidence:</span>
                    <span className="tahoe-text ml-2">{bot.confidence}</span>
                  </div>
                  <div>
                    <span className="tahoe-text">Action:</span>
                    <span className="tahoe-text ml-2">{bot.recommendedAction}</span>
                  </div>
                </div>
                <div>
                  <div className="tahoe-text text-sm mb-2">Detection Reasons:</div>
                  <div className="flex flex-wrap gap-2">
                    {bot.detectionReasons.map((reason, idx) => (
                      <Badge key={idx} variant="outline" className="text-orange-400 border-orange-400">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityScenarioAnalysis;
