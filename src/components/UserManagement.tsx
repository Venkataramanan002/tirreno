
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { User, Search, Filter, Shield, AlertTriangle, MapPin, Clock, UserX } from "lucide-react";
import { useState, useEffect } from "react";
import { userDataService } from "@/services/userDataService";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({
    totalUsers: 0,
    blockedUsers: 0,
    suspiciousUsers: 0,
    avgRiskScore: 0
  });

  useEffect(() => {
    const fetchRealUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get real Google data if available
        const googleDataRaw = localStorage.getItem('google_real_data');
        const gmailMetadataRaw = localStorage.getItem('gmail_metadata');
        const gmailSettingsRaw = localStorage.getItem('gmail_settings');
        let googleData = null;
        let gmailMetadata = null;
        let gmailSettings = null;
        
        try {
          if (googleDataRaw) googleData = JSON.parse(googleDataRaw);
          if (gmailMetadataRaw) gmailMetadata = JSON.parse(gmailMetadataRaw);
          if (gmailSettingsRaw) gmailSettings = JSON.parse(gmailSettingsRaw);
        } catch (error) {
          console.warn('Failed to parse Google data:', error);
        }
        
        // Get user profile
        const profile = await userDataService.initializeUserData();
        
        // Build real user data from actual profile
        const realUsers: any[] = [];
        
        if (profile) {
          // Calculate account age from creation time if available
          let accountAge = "Unknown";
          if (googleData?.profile?.accountCreationTime) {
            const creationDate = new Date(googleData.profile.accountCreationTime);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - creationDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 30) accountAge = `${diffDays} days`;
            else if (diffDays < 365) accountAge = `${Math.floor(diffDays / 30)} months`;
            else accountAge = `${Math.floor(diffDays / 365)} years`;
          }
          
          // Build threats list based on real data
          const threats: string[] = [];
          if (gmailMetadata?.suspiciousDomains && gmailMetadata.suspiciousDomains.length > 0) {
            threats.push(`${gmailMetadata.suspiciousDomains.length} suspicious email domains`);
          }
          if (gmailSettings?.forwardingEnabled) {
            threats.push("Email forwarding enabled");
          }
          if (gmailSettings?.delegatedAccounts && gmailSettings.delegatedAccounts.length > 0) {
            threats.push(`${gmailSettings.delegatedAccounts.length} delegated account(s)`);
          }
          if (profile.riskScore > 70) {
            threats.push("High risk score detected");
          }
          if (profile.isProxy || profile.isVpn) {
            threats.push("Proxy/VPN detected");
          }
          if (threats.length === 0) {
            threats.push("Normal behavior patterns");
          }
          
          realUsers.push({
            id: profile.id,
            email: profile.email,
            name: profile.name || googleData?.profile?.name || "Unknown User",
            riskScore: profile.riskScore,
            status: profile.riskScore > 70 ? "blocked" : 
                   profile.riskScore > 50 ? "flagged" : 
                   profile.riskScore > 40 ? "monitoring" : "normal",
            lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
            location: profile.location,
            device: profile.deviceType,
            totalSessions: Math.floor(Math.random() * 200) + 50,
            flaggedActivities: Math.floor(profile.riskScore / 10),
            accountAge: accountAge,
            threats: threats,
            emailVerified: googleData?.profile?.emailVerified || false,
            recoveryEmailStatus: googleData?.profile?.recoveryEmailStatus || false,
            picture: profile.picture || googleData?.profile?.picture || null
          });
        }
        
        // Fallback to fake data if no real user
        if (realUsers.length === 0) {
          realUsers.push(
            {
              id: "user_001",
              email: "john.doe@example.com",
              name: "John Doe",
              riskScore: 95,
              status: "blocked",
              lastLogin: "2024-01-15 14:32:18",
              location: "Unknown VPN",
              device: "Chrome/Windows",
              totalSessions: 156,
              flaggedActivities: 23,
              accountAge: "6 months",
              threats: ["Multiple failed logins", "Suspicious location", "Bot-like behavior"]
            },
    {
      id: "user_002",
      email: "jane.smith@example.com", 
      name: "Jane Smith",
      riskScore: 15,
      status: "normal",
      lastLogin: "2024-01-15 14:28:45",
      location: "New York, US",
      device: "Safari/macOS",
      totalSessions: 42,
      flaggedActivities: 0,
      accountAge: "2 years",
      threats: []
    },
    {
      id: "user_003",
      email: "bob.wilson@example.com",
      name: "Bob Wilson", 
      riskScore: 78,
      status: "flagged",
      lastLogin: "2024-01-15 14:25:12",
      location: "London, UK",
      device: "Firefox/Linux",
      totalSessions: 89,
      flaggedActivities: 12,
      accountAge: "1 year",
      threats: ["Account takeover attempt", "Password change from new device"]
    },
    {
      id: "user_004",
      email: "alice.brown@example.com",
      name: "Alice Brown",
      riskScore: 32,
      status: "monitoring",
      lastLogin: "2024-01-15 14:22:33",
      location: "California, US",
      device: "Chrome/Android",
      totalSessions: 67,
      flaggedActivities: 3,
      accountAge: "8 months",
      threats: ["Unusual navigation pattern"]
    },
    {
      id: "user_005",
      email: "temp.user.456@tempmail.com",
      name: "Unknown User",
      riskScore: 88,
      status: "suspicious", 
      lastLogin: "2024-01-15 14:18:07",
      location: "Moscow, Russia",
      device: "Chrome/Linux",
      totalSessions: 12,
      flaggedActivities: 8,
      accountAge: "2 days",
      threats: ["Disposable email", "New account", "Rapid activity"]
    },
    {
      id: "user_006",
      email: "mike.jones@example.com",
      name: "Mike Jones",
      riskScore: 45,
      status: "normal",
      lastLogin: "2024-01-15 14:15:58",
      location: "Texas, US", 
      device: "Edge/Windows",
      totalSessions: 234,
      flaggedActivities: 5,
      accountAge: "3 years",
      threats: ["Occasional unusual timing"]
            }
          );
        }
        
        // Calculate summary stats
        const totalUsers = realUsers.length;
        const blockedUsers = realUsers.filter(u => u.status === "blocked").length;
        const suspiciousUsers = realUsers.filter(u => u.status === "suspicious" || u.status === "flagged").length;
        const avgRiskScore = Math.round(realUsers.reduce((sum, u) => sum + u.riskScore, 0) / totalUsers);
        
        setSummaryStats({
          totalUsers,
          blockedUsers,
          suspiciousUsers,
          avgRiskScore
        });
        
        setUsers(realUsers);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to fake data on error
        const fallbackUsers = [
          {
            id: "user_001",
            email: "john.doe@example.com",
            name: "John Doe",
            riskScore: 95,
            status: "blocked",
            lastLogin: "2024-01-15 14:32:18",
            location: "Unknown VPN",
            device: "Chrome/Windows",
            totalSessions: 156,
            flaggedActivities: 23,
            accountAge: "6 months",
            threats: ["Multiple failed logins", "Suspicious location", "Bot-like behavior"]
          }
        ];
        setUsers(fallbackUsers);
        setSummaryStats({
          totalUsers: fallbackUsers.length,
          blockedUsers: 1,
          suspiciousUsers: 0,
          avgRiskScore: 95
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRealUserData();
  }, []);

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return "text-red-400";
    if (score >= 40) return "text-orange-400";
    return "text-green-400";
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "blocked":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 rounded-full px-4 py-1.5">BLOCKED</Badge>;
      case "suspicious":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 rounded-full px-4 py-1.5">SUSPICIOUS</Badge>;
      case "flagged":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 rounded-full px-4 py-1.5">FLAGGED</Badge>;
      case "monitoring":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 rounded-full px-4 py-1.5">MONITORING</Badge>;
      default:
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/40 rounded-full px-4 py-1.5">NORMAL</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesRisk = true;
    if (riskFilter === "high") matchesRisk = user.riskScore >= 70;
    else if (riskFilter === "medium") matchesRisk = user.riskScore >= 40 && user.riskScore < 70;
    else if (riskFilter === "low") matchesRisk = user.riskScore < 40;
    
    return matchesSearch && matchesRisk;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-white/20 border-t-cyan-400 mx-auto mb-6"></div>
          <p className="ios-text text-white/70">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* User Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="ios-text text-white/90">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ios-title text-white mb-2">{summaryStats.totalUsers}</div>
            <p className="ios-text text-white/50">Active accounts</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="ios-text text-white/90">Blocked Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ios-title text-red-400 mb-2">{summaryStats.blockedUsers}</div>
            <p className="ios-text text-white/50">Security violations</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="ios-text text-white/90">Suspicious Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ios-title text-orange-400 mb-2">{summaryStats.suspiciousUsers}</div>
            <p className="ios-text text-white/50">Require attention</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="ios-text text-white/90">Avg Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`ios-title ${getRiskScoreColor(summaryStats.avgRiskScore)} mb-2`}>{summaryStats.avgRiskScore}</div>
            <p className="ios-text text-white/50">Overall risk level</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Interface */}
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <User className="w-6 h-6 text-cyan-400" />
            Data-Driven Risk Assessment
          </CardTitle>
          <CardDescription className="text-white/60">
            Monitor and manage user accounts based on risk assessment and behavior analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <Input
                  placeholder="Search by email, name, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-5 glass rounded-2xl border border-white/10 ios-transition hover:bg-white/5">
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center space-x-4">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white/20" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full flex items-center justify-center border border-white/20">
                        <User className="w-6 h-6 text-cyan-400" />
                      </div>
                    )}
                    <div>
                      <div className="ios-text-lg text-white font-semibold mb-1">{user.name}</div>
                      <div className="ios-text text-white/60">{user.email}</div>
                      <div className="ios-text text-white/40 text-xs mt-1">ID: {user.id}</div>
                      {user.emailVerified !== undefined && (
                        <div className="ios-text text-white/50 text-xs mt-1">
                          Email: {user.emailVerified ? '✓ Verified' : '✗ Unverified'}
                        </div>
                      )}
                      {user.recoveryEmailStatus !== undefined && (
                        <div className="ios-text text-white/50 text-xs mt-1">
                          Recovery Email: {user.recoveryEmailStatus ? '✓ Set' : '✗ Not Set'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(user.status)}
                    <div className="text-right">
                      <div className={`ios-title text-white ${getRiskScoreColor(user.riskScore)}`}>
                        {user.riskScore}
                      </div>
                      <div className="ios-text text-white/50 text-xs">{getRiskLevel(user.riskScore)} RISK</div>
                    </div>
                  </div>
                </div>

                {/* Risk Score Progress Bar */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="ios-text text-white/60">Risk Score</span>
                    <span className={`ios-text font-semibold ${getRiskScoreColor(user.riskScore)}`}>
                      {user.riskScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={user.riskScore} 
                  />
                </div>

                {/* User Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-white/50" />
                    <div>
                      <div className="ios-text text-white/50 text-xs">Last Login</div>
                      <div className="ios-text text-white/90">{user.lastLogin}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-white/50" />
                    <div>
                      <div className="ios-text text-white/50 text-xs">Location</div>
                      <div className="ios-text text-white/90">{user.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-white/50" />
                    <div>
                      <div className="ios-text text-white/50 text-xs">Account Age</div>
                      <div className="ios-text text-white/90">{user.accountAge}</div>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center p-4 glass rounded-xl border border-white/10">
                    <div className="ios-title text-white mb-1">{user.totalSessions}</div>
                    <div className="ios-text text-white/50 text-xs">Total Sessions</div>
                  </div>
                  <div className="text-center p-4 glass rounded-xl border border-white/10">
                    <div className="ios-title text-orange-400 mb-1">{user.flaggedActivities}</div>
                    <div className="ios-text text-white/50 text-xs">Flagged Activities</div>
                  </div>
                  <div className="text-center p-4 glass rounded-xl border border-white/10">
                    <div className="ios-text-lg text-white/90 font-semibold mb-1">{user.device}</div>
                    <div className="ios-text text-white/50 text-xs">Primary Device</div>
                  </div>
                </div>

                {/* Threats */}
                {user.threats.length > 0 && (
                  <div className="mb-5">
                    <div className="ios-text text-white/60 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Active Threats:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.threats.map((threat, index) => (
                        <Badge key={index} variant="outline" className="border-red-400/40 bg-red-400/10 text-red-400">
                          {threat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  <Button size="sm" variant="outline">
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline">
                    View Sessions
                  </Button>
                  {user.status !== "blocked" && (
                    <Button size="sm" variant="destructive">
                      <UserX className="w-4 h-4 mr-2" />
                      Block User
                    </Button>
                  )}
                  <Button size="sm" variant="default">
                    Investigate
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <User className="w-16 h-16 text-white/30 mx-auto mb-6" />
              <p className="ios-text text-white/60">No users match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
