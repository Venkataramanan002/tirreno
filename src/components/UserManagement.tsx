
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { User, Search, Filter, Shield, AlertTriangle, MapPin, Clock, UserX } from "lucide-react";
import { useState } from "react";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  // Mock user data
  const users = [
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
  ];

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
        return <Badge className="bg-red-700 text-white">BLOCKED</Badge>;
      case "suspicious":
        return <Badge className="bg-red-600 text-white">SUSPICIOUS</Badge>;
      case "flagged":
        return <Badge className="bg-orange-600 text-white">FLAGGED</Badge>;
      case "monitoring":
        return <Badge className="bg-blue-600 text-white">MONITORING</Badge>;
      default:
        return <Badge className="bg-green-600 text-white">NORMAL</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesRisk = true;
    if (riskFilter === "high") matchesRisk = user.riskScore >= 70;
    else if (riskFilter === "medium") matchesRisk = user.riskScore >= 40 && user.riskScore < 70;
    else if (riskFilter === "low") matchesRisk = user.riskScore < 40;
    
    return matchesSearch && matchesRisk;
  });

  // Summary stats
  const totalUsers = users.length;
  const blockedUsers = users.filter(u => u.status === "blocked").length;
  const suspiciousUsers = users.filter(u => u.status === "suspicious" || u.status === "flagged").length;
  const avgRiskScore = Math.round(users.reduce((sum, u) => sum + u.riskScore, 0) / totalUsers);

  return (
    <div className="space-y-6">
      {/* User Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
            <p className="text-xs text-slate-400">Active accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Blocked Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{blockedUsers}</div>
            <p className="text-xs text-slate-400">Security violations</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Suspicious Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{suspiciousUsers}</div>
            <p className="text-xs text-slate-400">Require attention</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Avg Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskScoreColor(avgRiskScore)}`}>{avgRiskScore}</div>
            <p className="text-xs text-slate-400">Overall risk level</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Interface */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Data-Driven Risk Assessment
          </CardTitle>
          <CardDescription className="text-slate-400">
            Monitor and manage user accounts based on risk assessment and behavior analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by email, name, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                      <div className="text-xs text-slate-500">ID: {user.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(user.status)}
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getRiskScoreColor(user.riskScore)}`}>
                        {user.riskScore}
                      </div>
                      <div className="text-xs text-slate-400">{getRiskLevel(user.riskScore)} RISK</div>
                    </div>
                  </div>
                </div>

                {/* Risk Score Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-400">Risk Score</span>
                    <span className={`text-sm font-medium ${getRiskScoreColor(user.riskScore)}`}>
                      {user.riskScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={user.riskScore} 
                    className="h-2 bg-slate-600"
                  />
                </div>

                {/* User Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Last Login</div>
                      <div className="text-sm text-slate-300">{user.lastLogin}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Location</div>
                      <div className="text-sm text-slate-300">{user.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Account Age</div>
                      <div className="text-sm text-slate-300">{user.accountAge}</div>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-2 bg-slate-600/50 rounded">
                    <div className="text-lg font-bold text-white">{user.totalSessions}</div>
                    <div className="text-xs text-slate-400">Total Sessions</div>
                  </div>
                  <div className="text-center p-2 bg-slate-600/50 rounded">
                    <div className="text-lg font-bold text-orange-400">{user.flaggedActivities}</div>
                    <div className="text-xs text-slate-400">Flagged Activities</div>
                  </div>
                  <div className="text-center p-2 bg-slate-600/50 rounded">
                    <div className="text-lg font-bold text-slate-300">{user.device}</div>
                    <div className="text-xs text-slate-400">Primary Device</div>
                  </div>
                </div>

                {/* Threats */}
                {user.threats.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Active Threats:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.threats.map((threat, index) => (
                        <Badge key={index} variant="outline" className="text-red-400 border-red-400">
                          {threat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600">
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600">
                    View Sessions
                  </Button>
                  {user.status !== "blocked" && (
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <UserX className="w-4 h-4 mr-2" />
                      Block User
                    </Button>
                  )}
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                    Investigate
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No users match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
