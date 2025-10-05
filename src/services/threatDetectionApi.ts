import { supabase } from '@/integrations/supabase/client';

export interface ThreatData {
  id: string;
  timestamp: string;
  threatType: string;
  target: string;
  status: string;
  affectedSystems: number;
  potentialLoss: string;
  description: string;
}

export interface ThreatAlert {
  id: string;
  timestamp: string;
  user: string;
  alertType: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'critical';
  status: string;
}

export interface ThreatType {
  type: string;
  detected: number;
  blocked: number;
  severity: 'high' | 'medium' | 'low';
}

export interface HourlyThreatData {
  hour: string;
  bots: number;
  fraud: number;
  attacks: number;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  triggered: number;
  accuracy: number;
}

export const threatDetectionApi = {
  getThreatTypes: async (): Promise<ThreatType[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('threat_detections')
      .select('threat_type, severity, status')
      .eq('user_id', user.id);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const types: { [key: string]: { detected: number; blocked: number; severity: string } } = {};
    
    data.forEach(threat => {
      if (!types[threat.threat_type]) {
        types[threat.threat_type] = { detected: 0, blocked: 0, severity: threat.severity };
      }
      types[threat.threat_type].detected++;
      if (threat.status === 'blocked') {
        types[threat.threat_type].blocked++;
      }
    });

    return Object.entries(types).map(([type, info]) => ({
      type,
      detected: info.detected,
      blocked: info.blocked,
      severity: info.severity as 'high' | 'medium' | 'low',
    }));
  },
  
  getHourlyData: async (): Promise<HourlyThreatData[]> => {
    const timeline: HourlyThreatData[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      timeline.push({
        hour: hourStr,
        bots: 0,
        fraud: 0,
        attacks: 0,
      });
    }

    return timeline;
  },
  
  getDetectionRules: async (): Promise<DetectionRule[]> => {
    return [];
  },
  
  getThreatData: async (): Promise<ThreatData[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('threat_detections')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map(threat => ({
      id: threat.id,
      timestamp: new Date(threat.detected_at).toLocaleString(),
      threatType: threat.threat_type,
      target: threat.target || 'Data not available',
      status: threat.status,
      affectedSystems: 0,
      potentialLoss: 'Data not available',
      description: 'Data not available',
    }));
  },
    
  getThreatAlerts: async (): Promise<ThreatAlert[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('threat_detections')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    return data.map(threat => ({
      id: threat.id,
      timestamp: new Date(threat.detected_at).toLocaleString(),
      user: profileData?.email || 'Data not available',
      alertType: threat.threat_type,
      description: 'Data not available',
      severity: threat.severity as 'high' | 'medium' | 'low' | 'critical',
      status: threat.status,
    }));
  },
  
  updateRule: (ruleId: string, status: 'active' | 'inactive'): Promise<DetectionRule> => {
    console.log(`Updating rule ${ruleId} to ${status}`);
    return Promise.resolve({
      id: ruleId,
      name: "Updated Rule",
      description: "Rule status updated",
      status,
      triggered: 0,
      accuracy: 95
    });
  },
};
