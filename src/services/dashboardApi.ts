import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  riskScore: number;
  threatsDetected: number;
  falsePositives: number;
  threatsBlocked: number;
  botTraffic: number;
  userGrowth: string;
  threatGrowth: string;
  blockRate: string;
  botPercentage: string;
}

export interface ThreatTimelineItem {
  time: string;
  threats: number;
  blocked: number;
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
        threatsDetected: 0,
        falsePositives: 0,
        threatsBlocked: 0,
        botTraffic: 0,
        userGrowth: 'Data not available',
        threatGrowth: 'Data not available',
        blockRate: 'Data not available',
        botPercentage: 'Data not available',
      };
    }

    return {
      totalUsers: data.total_sessions,
      activeUsers: data.active_sessions,
      riskScore: Number(data.risk_score),
      threatsDetected: data.threats_detected,
      falsePositives: data.false_positives,
      threatsBlocked: data.threats_blocked,
      botTraffic: data.bot_traffic,
      userGrowth: 'Data not available',
      threatGrowth: 'Data not available',
      blockRate: data.threats_blocked > 0 
        ? `${Math.round((data.threats_blocked / data.threats_detected) * 100)}%`
        : 'Data not available',
      botPercentage: data.total_sessions > 0
        ? `${Math.round((data.bot_traffic / data.total_sessions) * 100)}%`
        : 'Data not available',
    };
  },
  
  getThreatTimeline: async (): Promise<ThreatTimelineItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('threat_detections')
      .select('detected_at')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Group by hour for the last 24 hours
    const timeline: ThreatTimelineItem[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      timeline.push({
        time: hourStr,
        threats: 0,
        blocked: 0,
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
