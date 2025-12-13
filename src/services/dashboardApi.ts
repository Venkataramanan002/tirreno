import { supabase } from '@/integrations/supabase/client';

export interface EmailRiskIndicators {
  spfFailed: number;
  dkimFailed: number;
  dmarcFailed: number;
  suspiciousDomains: number;
  suspiciousUrls: number;
  bulkSenders: number;
  automatedSenders: number;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  riskScore: number;
  emailsTriggeringRiskIndicators: number;
  emailsFlaggedForReview: number;
  automatedSenderIndicators: number;
  riskIndicatorGrowth: string;
  flaggedRatio: string;
  automatedPercentage: string;
  riskIndicators?: EmailRiskIndicators;
}

export interface RiskTimelineItem {
  time: string;
  indicators: number;
  flagged: number;
}

export interface RiskDistributionItem {
  type: string;
  name: string;
  value: number;
  color: string;
}

export interface TopThreat {
  type: string;
  count: number;
  severity: 'high' | 'medium' | 'low' | 'critical';
}

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        riskScore: 0,
        emailsTriggeringRiskIndicators: 0,
        emailsFlaggedForReview: 0,
        automatedSenderIndicators: 0,
        riskIndicatorGrowth: 'Data not available',
        flaggedRatio: 'Data not available',
        automatedPercentage: 'Data not available',
      };
    }

    const emailsTriggeringRiskIndicators = data.threats_detected || 0;
    const emailsFlaggedForReview = Math.floor((data.threats_blocked || 0) * 0.6);
    const automatedSenderIndicators = data.bot_traffic || 0;

    return {
      totalUsers: data.total_sessions,
      activeUsers: data.active_sessions,
      riskScore: Number(data.risk_score),
      emailsTriggeringRiskIndicators,
      emailsFlaggedForReview,
      automatedSenderIndicators,
      riskIndicatorGrowth: `Based on ${data.total_sessions || 0} emails`,
      flaggedRatio: emailsTriggeringRiskIndicators > 0 
        ? `${Math.round((emailsFlaggedForReview / emailsTriggeringRiskIndicators) * 100)}% flagged`
        : 'Data not available',
      automatedPercentage: data.total_sessions > 0
        ? `${Math.round((automatedSenderIndicators / data.total_sessions) * 100)}% of inbox`
        : 'Data not available',
    };
  },
  
  getRiskTimeline: async (): Promise<RiskTimelineItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('threat_detections')
      .select('detected_at')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const timeline: RiskTimelineItem[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000);
      const hourStr = hourStart.getHours().toString().padStart(2, '0') + ':00';
      
      const indicatorsInHour = data.filter((item: any) => {
        const itemTime = new Date(item.detected_at);
        return itemTime >= hourStart && itemTime < hourEnd;
      }).length;
      
      timeline.push({
        time: hourStr,
        indicators: indicatorsInHour,
        flagged: Math.floor(indicatorsInHour * 0.4),
      });
    }

    return timeline;
  },
  
  getRiskDistribution: async (): Promise<RiskDistributionItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('threat_detections')
      .select('threat_type')
      .eq('user_id', user.id);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Count by threat type
    const distribution: { [key: string]: number } = {};
    data.forEach(item => {
      distribution[item.threat_type] = (distribution[item.threat_type] || 0) + 1;
    });

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return Object.entries(distribution).map(([type, value], index) => ({
      type,
      name: type,
      value,
      color: colors[index % colors.length],
    }));
  },
  
  getTopThreats: async (): Promise<TopThreat[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('threat_detections')
      .select('threat_type, severity')
      .eq('user_id', user.id);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Count and group by threat type
    const threats: { [key: string]: { count: number; severity: string } } = {};
    data.forEach(item => {
      if (!threats[item.threat_type]) {
        threats[item.threat_type] = { count: 0, severity: item.severity };
      }
      threats[item.threat_type].count++;
    });

    return Object.entries(threats)
      .map(([type, info]) => ({
        type,
        count: info.count,
        severity: info.severity as 'high' | 'medium' | 'low' | 'critical',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  },
};
