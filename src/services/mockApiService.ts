
import { DashboardMetrics, ThreatTimelineItem, RiskDistributionItem, TopThreat } from './dashboardApi';
import { SecurityEvent } from './securityEventsApi';
import { ThreatData, ThreatAlert } from './threatDetectionApi';

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  riskUsers: number;
  averageSessionTime: string;
}

export interface SessionData {
  time: string;
  activeSessions: number;
  newSessions: number;
}

export interface User {
  userId: string;
  email: string;
  deviceType: string;
  ipAddress: string;
  location: string;
  deviceFingerprint: string;
  sessionStart: string;
  riskScore: number;
  status: 'normal' | 'suspicious' | 'high-risk';
  anomalies: string[];
  activityLevel?: 'low' | 'medium' | 'high';
  lastActivity?: string;
}

// Store for personalized data based on user email
let currentUserEmail: string | null = null;
let personalizedData: any = {};

const calculateRiskScore = (email: string): number => {
  let score = Math.random() * 30 + 20; // Base score 20-50
  
  if (email.includes('admin') || email.includes('root')) score += 30;
  if (email.includes('.gov') || email.includes('.mil')) score += 25;
  if (email.includes('temp') || email.includes('test')) score += 35;
  if (email.length < 10) score += 15;
  if (email.includes('security') || email.includes('it')) score += 20;
  
  return Math.min(100, Math.round(score));
};

const generateThreatsForUser = (email: string) => {
  const baseThreats = ['Phishing', 'Malware', 'Brute Force', 'Social Engineering'];
  if (email.includes('admin')) baseThreats.push('Privilege Escalation', 'Data Exfiltration');
  if (email.includes('.gov')) baseThreats.push('APT Attack', 'Nation State Actor');
  
  return baseThreats.slice(0, 3 + Math.floor(Math.random() * 3));
};

const generateEventsForUser = (email: string, riskScore: number) => {
  const severity = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
  return [
    {
      id: `SE_${email.split('@')[0]}_001`,
      timestamp: new Date().toISOString(),
      source: "Authentication System",
      event: "Login Attempt",
      description: `Login detected for ${email}`,
      severity: severity as 'low' | 'medium' | 'high' | 'critical',
      user: email,
      ipAddress: generateRandomIP(),
      location: getRandomLocation()
    }
  ];
};

const generateMetricsForUser = (email: string, riskScore: number) => ({
  totalUsers: 1247,
  activeUsers: 892,
  riskScore: riskScore / 10,
  threatsDetected: Math.floor(riskScore / 2),
  falsePositives: Math.floor(Math.random() * 5),
  threatsBlocked: Math.floor(riskScore / 2.5),
  botTraffic: Math.floor(riskScore / 3),
  userGrowth: riskScore > 50 ? "-5%" : "+12%",
  threatGrowth: `+${Math.floor(riskScore / 5)}%`,
  blockRate: `${Math.min(95, 80 + Math.floor(riskScore / 5))}%`,
  botPercentage: `${Math.floor(riskScore / 4)}%`
});

const generateTimelineForUser = (email: string) => [
  { time: "14:00", threats: 12, blocked: 10 },
  { time: "15:00", threats: 18, blocked: 15 },
  { time: "16:00", threats: 25, blocked: 22 },
  { time: "17:00", threats: Math.floor(personalizedData.riskScore || 50), blocked: Math.floor((personalizedData.riskScore || 50) * 0.8) },
  { time: "18:00", threats: 28, blocked: 25 }
];

const generateDistributionForUser = (email: string) => [
  { type: "Low Risk", name: "Low Risk", value: Math.max(10, 60 - (personalizedData.riskScore || 30)), color: "#10b981" },
  { type: "Medium Risk", name: "Medium Risk", value: 25, color: "#f59e0b" },
  { type: "High Risk", name: "High Risk", value: Math.min(40, personalizedData.riskScore || 15), color: "#ef4444" }
];

const generateTopThreatsForUser = (email: string) => [
  { type: "Phishing Attempts", count: Math.floor((personalizedData.riskScore || 30) / 2), severity: 'high' as const },
  { type: "Malware Detection", count: Math.floor((personalizedData.riskScore || 30) / 3), severity: 'critical' as const },
  { type: "Brute Force", count: Math.floor((personalizedData.riskScore || 30) / 4), severity: 'medium' as const }
];

const generateRandomIP = (): string => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

const getRandomLocation = (): string => {
  const locations = ["New York, USA", "London, UK", "Tokyo, Japan", "Sydney, Australia", "Berlin, Germany"];
  return locations[Math.floor(Math.random() * locations.length)];
};

const generatePersonalizedData = (email: string) => {
  const riskScore = calculateRiskScore(email);
  const threats = generateThreatsForUser(email);
  const events = generateEventsForUser(email, riskScore);
  
  return {
    riskScore,
    threats,
    events,
    metrics: generateMetricsForUser(email, riskScore),
    timeline: generateTimelineForUser(email),
    distribution: generateDistributionForUser(email),
    topThreats: generateTopThreatsForUser(email)
  };
};

export const setCurrentUser = (email: string) => {
  currentUserEmail = email;
  personalizedData = generatePersonalizedData(email);
};

export const mockApiService = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return personalizedData.metrics || {
      totalUsers: 1247,
      activeUsers: 892,
      riskScore: 7.8,
      threatsDetected: 56,
      falsePositives: 2,
      threatsBlocked: 45,
      botTraffic: 23,
      userGrowth: "+12%",
      threatGrowth: "+18%",
      blockRate: "89%",
      botPercentage: "12%"
    };
  },

  getThreatTimeline: async (): Promise<ThreatTimelineItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return personalizedData.timeline || [
      { time: "14:00", threats: 12, blocked: 10 },
      { time: "15:00", threats: 18, blocked: 15 },
      { time: "16:00", threats: 25, blocked: 22 },
      { time: "17:00", threats: 42, blocked: 38 },
      { time: "18:00", threats: 28, blocked: 25 }
    ];
  },

  getRiskDistribution: async (): Promise<RiskDistributionItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return personalizedData.distribution || [
      { type: "Low Risk", name: "Low Risk", value: 45, color: "#10b981" },
      { type: "Medium Risk", name: "Medium Risk", value: 35, color: "#f59e0b" },
      { type: "High Risk", name: "High Risk", value: 20, color: "#ef4444" }
    ];
  },

  getTopThreats: async (): Promise<TopThreat[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return personalizedData.topThreats || [
      { type: "Phishing Attempts", count: 32, severity: 'high' },
      { type: "Malware Detection", count: 18, severity: 'critical' },
      { type: "Brute Force", count: 12, severity: 'medium' }
    ];
  },

  getUserMetrics: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalUsers: 1247,
      activeUsers: 892,
      riskUsers: 23,
      averageSessionTime: "18m 32s"
    };
  },

  getSessionData: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { time: "00:00", activeSessions: 245, newSessions: 12 },
      { time: "04:00", activeSessions: 189, newSessions: 8 },
      { time: "08:00", activeSessions: 567, newSessions: 45 },
      { time: "12:00", activeSessions: 892, newSessions: 78 },
      { time: "16:00", activeSessions: 734, newSessions: 34 },
      { time: "20:00", activeSessions: 456, newSessions: 23 }
    ];
  },

  getUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (currentUserEmail) {
      return [
        {
          id: `USER_${currentUserEmail.split('@')[0]}`,
          userId: `USER_${currentUserEmail.split('@')[0]}`,
          email: currentUserEmail,
          deviceType: "Desktop",
          ipAddress: generateRandomIP(),
          location: getRandomLocation(),
          deviceFingerprint: `FP_${Math.random().toString(36).substring(7)}`,
          sessionStart: new Date().toISOString(),
          riskScore: personalizedData.riskScore || 50,
          status: personalizedData.riskScore > 70 ? "high-risk" : personalizedData.riskScore > 40 ? "suspicious" : "normal",
          anomalies: personalizedData.threats || ["Behavioral Analysis Pending"],
          activityLevel: "high" as const,
          lastActivity: new Date().toISOString()
        }
      ];
    }
    
    return [
      {
        id: "USER_LegitCustomer_789",
        userId: "USER_LegitCustomer_789",
        email: "anjali.sharma@example.com",
        deviceType: "Desktop",
        ipAddress: "203.0.113.10",
        location: "Bengaluru, India",
        deviceFingerprint: "FP_BHQ654JKL",
        sessionStart: "2025-05-30 17:06:30",
        riskScore: 1.2,
        status: "normal" as const,
        anomalies: [],
        activityLevel: "medium" as const,
        lastActivity: "2025-05-30 17:07:45"
      }
    ];
  },

  getSecurityEvents: async (): Promise<SecurityEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return personalizedData.events || [
      {
        id: "SE_MalwareDetected_987",
        timestamp: "2025-05-30 17:10:00",
        source: "Endpoint Security",
        event: "Malware Detected",
        description: "A malware was detected on user's machine.",
        severity: "critical" as const,
        user: "john.doe@example.com",
        ipAddress: "192.168.1.100",
        location: "New York, USA"
      }
    ];
  },

  getThreatTypes: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { type: "Malware", detected: 45, blocked: 42, severity: "high" as const },
      { type: "Phishing", detected: 32, blocked: 30, severity: "high" as const },
      { type: "DDoS", detected: 18, blocked: 15, severity: "medium" as const },
      { type: "Bot Traffic", detected: 67, blocked: 60, severity: "low" as const }
    ];
  },

  getHourlyThreatData: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { hour: "14:00", bots: 12, fraud: 5, attacks: 3 },
      { hour: "15:00", bots: 18, fraud: 8, attacks: 4 },
      { hour: "16:00", bots: 25, fraud: 12, attacks: 7 },
      { hour: "17:00", bots: 42, fraud: 15, attacks: 9 },
      { hour: "18:00", bots: 28, fraud: 9, attacks: 5 }
    ];
  },

  getDetectionRules: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: "rule_001",
        name: "Brute Force Detection",
        description: "Detects multiple failed login attempts",
        status: "active" as const,
        triggered: 15,
        accuracy: 94
      },
      {
        id: "rule_002", 
        name: "Suspicious IP Detection",
        description: "Flags known malicious IP addresses",
        status: "active" as const,
        triggered: 8,
        accuracy: 98
      }
    ];
  },

  getThreatData: async (): Promise<ThreatData[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: "TD_RansomwareAttack_001",
        timestamp: "2025-05-30 17:20:00",
        threatType: "Ransomware Attack",
        target: "Finance Department",
        status: "active",
        affectedSystems: 15,
        potentialLoss: "$500,000",
        description: "Ransomware attack targeting financial documents."
      }
    ];
  },

  getThreatAlerts: async (): Promise<ThreatAlert[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: "TA_HighRiskLogin_001",
        timestamp: "2025-05-30 17:30:00",
        user: currentUserEmail || "john.doe@example.com",
        alertType: "High-Risk Login",
        description: `Login from unusual location detected for ${currentUserEmail || "user"}`,
        severity: "high" as const,
        status: "unresolved"
      }
    ];
  }
};
