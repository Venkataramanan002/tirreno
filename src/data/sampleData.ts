
export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  userId?: string;
  ipAddress: string;
  location: string;
  deviceFingerprint?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  details: string;
  riskScore?: number;
  userAgent?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  deviceType: string;
  ipAddress: string;
  location: string;
  deviceFingerprint: string;
  sessionStart: string;
  riskScore: number;
  riskLevel: string;
  activities: SecurityEvent[];
}

export interface ThreatIntelligence {
  ipAddress: string;
  threatType: string;
  confidenceScore: number;
  riskLevel: string;
  lastSeen: string;
  associatedCampaigns: string[];
}

export interface BotDetection {
  ipAddress: string;
  botScore: number;
  botType: string;
  detectionReasons: string[];
  recommendedAction: string;
  confidence: string;
}

// Dynamic sample data that adapts to current user
export const getCurrentUserSession = (email?: string): UserSession => {
  const defaultEmail = email || "user@example.com";
  const riskScore = calculateDynamicRiskScore(defaultEmail);
  
  return {
    userId: `USER_${defaultEmail.split('@')[0]}`,
    email: defaultEmail,
    deviceType: "Desktop (Chrome, Windows 10)",
    ipAddress: generateRandomIP(),
    location: getDynamicLocation(defaultEmail),
    deviceFingerprint: `FP_${Math.random().toString(36).substring(7)}`,
    sessionStart: new Date().toISOString(),
    riskScore,
    riskLevel: riskScore > 70 ? "Critical" : riskScore > 40 ? "High" : "Medium",
    activities: generateDynamicEvents(defaultEmail, riskScore)
  };
};

const calculateDynamicRiskScore = (email: string): number => {
  let score = Math.random() * 30 + 30; // Base score 30-60
  
  if (email.includes('admin') || email.includes('root')) score += 25;
  if (email.includes('.gov') || email.includes('.mil')) score += 20;
  if (email.includes('temp') || email.includes('test')) score += 30;
  if (email.includes('security') || email.includes('it')) score += 15;
  if (email.length < 10) score += 10;
  
  return Math.min(100, Math.round(score));
};

const generateRandomIP = (): string => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

const getDynamicLocation = (email: string): string => {
  const domains = email.split('@')[1] || '';
  
  if (domains.includes('.gov')) return "Washington, DC, USA";
  if (domains.includes('.edu')) return "Boston, MA, USA";
  if (domains.includes('.co.uk')) return "London, UK";
  if (domains.includes('.de')) return "Berlin, Germany";
  if (domains.includes('.au')) return "Sydney, Australia";
  
  const locations = ["New York, USA", "San Francisco, USA", "London, UK", "Tokyo, Japan", "Sydney, Australia"];
  return locations[Math.floor(Math.random() * locations.length)];
};

const generateDynamicEvents = (email: string, riskScore: number): SecurityEvent[] => {
  const severity = riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low';
  
  return [
    {
      id: `evt_${Date.now()}_001`,
      timestamp: new Date().toISOString(),
      eventType: "User Authentication",
      userId: `USER_${email.split('@')[0]}`,
      ipAddress: generateRandomIP(),
      location: getDynamicLocation(email),
      severity: 'low',
      status: "success",
      details: `Successful login for ${email}`,
    },
    {
      id: `evt_${Date.now()}_002`,
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      eventType: "Risk Assessment",
      userId: `USER_${email.split('@')[0]}`,
      ipAddress: generateRandomIP(),
      location: getDynamicLocation(email),
      severity,
      status: "detected",
      details: `Risk score calculated: ${riskScore}/100 for user profile analysis`,
      riskScore
    }
  ];
};

// Static sample data for fallback
export const sampleSecurityEvents: SecurityEvent[] = [
  {
    id: "evt_001",
    timestamp: "2025-05-30 17:06:30",
    eventType: "User Behavior",
    userId: "USER_LegitCustomer_789",
    ipAddress: "203.0.113.10",
    location: "Bengaluru, India",
    deviceFingerprint: "FP_BHQ654JKL",
    severity: "low",
    status: "normal",
    details: "User lands on homepage - Page View: /homepage, Referrer: direct"
  },
  {
    id: "evt_002",
    timestamp: "2025-05-30 17:06:45",
    eventType: "Authentication Success",
    userId: "USER_LegitCustomer_789",
    ipAddress: "203.0.113.10",
    location: "Bengaluru, India",
    severity: "low",
    status: "success",
    details: "Successful login - Username: anjali.sharma@example.com, Method: Password, Latency: 300ms"
  }
];

export const sampleUserSession: UserSession = getCurrentUserSession();

export const sampleThreatIntelligence: ThreatIntelligence[] = [
  {
    ipAddress: "185.199.110.153",
    threatType: "Botnet Command & Control, Spam Source",
    confidenceScore: 95,
    riskLevel: "High",
    lastSeen: "2025-05-30 10:00:00",
    associatedCampaigns: ["Phishing Kit Alpha"]
  }
];

export const sampleBotDetection: BotDetection[] = [
  {
    ipAddress: "104.28.249.200",
    botScore: 88,
    botType: "Automated Scraper",
    detectionReasons: [
      "Extreme Request Rate",
      "Lack of typical human mouse/keyboard events",
      "Unusual sequential access pattern to user profiles"
    ],
    recommendedAction: "Block traffic from this IP address immediately",
    confidence: "High"
  }
];

export const sampleMetrics = {
  activeUsers: 1247,
  threatsDetected: 352,
  threatsBlocked: 323,
  botTraffic: 156,
  userGrowth: "+12%",
  threatGrowth: "+18%",
  blockRate: "91.8%",
  botPercentage: "15.2%"
};

export const sampleHourlyThreatData = [
  { hour: "14:00", bots: 12, fraud: 5, attacks: 3 },
  { hour: "15:00", bots: 18, fraud: 8, attacks: 4 },
  { hour: "16:00", bots: 25, fraud: 12, attacks: 7 },
  { hour: "17:00", bots: 42, fraud: 15, attacks: 9 },
  { hour: "18:00", bots: 28, fraud: 9, attacks: 5 }
];
