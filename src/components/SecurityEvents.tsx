
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, MapPin, User, Search, Filter, Download } from "lucide-react";
import { useState } from "react";

const SecurityEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Mock security events data
  const securityEvents = [
    {
      id: "evt_001",
      timestamp: "2024-01-15 14:32:18",
      type: "Brute Force Attack",
      severity: "high",
      user: "john.doe@example.com",
      ip: "192.168.1.100",
      location: "Unknown VPN",
      description: "Multiple failed login attempts detected (15 attempts in 2 minutes)",
      status: "blocked",
      riskScore: 95
    },
    {
      id: "evt_002",
      timestamp: "2024-01-15 14:29:45",
      type: "Suspicious Session",
      severity: "medium",
      user: "jane.smith@example.com", 
      ip: "203.0.113.42",
      location: "Moscow, Russia",
      description: "Login from unusual geographic location",
      status: "flagged",
      riskScore: 72
    },
    {
      id: "evt_003",
      timestamp: "2024-01-15 14:25:12",
      type: "Bot Traffic",
      severity: "high",
      user: "bot_user_456",
      ip: "198.51.100.23",
      location: "Frankfurt, Germany",
      description: "Automated behavior detected - rapid page navigation",
      status: "blocked",
      riskScore: 88
    },
    {
      id: "evt_004",
      timestamp: "2024-01-15 14:22:33",
      type: "Account Takeover",
      severity: "high",
      user: "bob.wilson@example.com",
      ip: "10.0.0.15",
      location: "London, UK",
      description: "Password changed after successful login from new device",
      status: "investigating",
      riskScore: 91
    },
    {
      id: "evt_005",
      timestamp: "2024-01-15 14:18:07",
      type: "Fake Account",
      severity: "medium",
      user: "temp.email.123@tempmail.com",
      ip: "172.16.0.45",
      location: "California, US",
      description: "Account created with disposable email and suspicious patterns",
      status: "flagged",
      riskScore: 65
    },
    {
      id: "evt_006",
      timestamp: "2024-01-15 14:15:58",
      type: "Session Hijacking",
      severity: "low",
      user: "alice.brown@example.com",
      ip: "192.0.2.88",
      location: "New York, US",
      description: "Unusual session cookie behavior detected",
      status: "monitoring",
      riskScore: 45
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-400";
      case "medium": return "text-orange-400";
      default: return "text-yellow-400";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-600 text-white">HIGH</Badge>;
      case "medium":
        return <Badge className="bg-orange-600 text-white">MEDIUM</Badge>;
      default:
        return <Badge className="bg-yellow-600 text-white">LOW</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "blocked":
        return <Badge className="bg-red-700 text-white">BLOCKED</Badge>;
      case "flagged":
        return <Badge className="bg-orange-700 text-white">FLAGGED</Badge>;
      case "investigating":
        return <Badge className="bg-purple-700 text-white">INVESTIGATING</Badge>;
      default:
        return <Badge className="bg-blue-700 text-white">MONITORING</Badge>;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-red-400";
    if (score >= 50) return "text-orange-400";
    return "text-green-400";
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.ip.includes(searchTerm);
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Event Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1,247</div>
            <p className="text-xs text-slate-400">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">High Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">342</div>
            <p className="text-xs text-slate-400">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">895</div>
            <p className="text-xs text-slate-400">Automatically blocked</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Under Investigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">67</div>
            <p className="text-xs text-slate-400">Manual review required</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-cyan-400" />
            Security Events Feed
          </CardTitle>
          <CardDescription className="text-slate-400">
            Real-time security events and threat incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search events by type, user, or IP address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`w-5 h-5 ${getSeverityColor(event.severity)}`} />
                    <div>
                      <div className="text-white font-medium">{event.type}</div>
                      <div className="text-sm text-slate-400">ID: {event.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(event.severity)}
                    {getStatusBadge(event.status)}
                  </div>
                </div>

                <p className="text-slate-300 mb-4">{event.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{event.timestamp}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{event.user}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400">Risk Score:</span>
                    <span className={`text-sm font-bold ${getRiskScoreColor(event.riskScore)}`}>
                      {event.riskScore}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    IP: <span className="text-slate-300 font-mono">{event.ip}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600">
                      View Details
                    </Button>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                      Investigate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No security events match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityEvents;
