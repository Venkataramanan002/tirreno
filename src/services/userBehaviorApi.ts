import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
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

export const userBehaviorApi = {
  getMetrics: async (): Promise<UserMetrics> => {
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
        riskUsers: 0,
        averageSessionTime: 'Data not available',
      };
    }

    return {
      totalUsers: data.total_sessions,
      activeUsers: data.active_sessions,
      riskUsers: 0,
      averageSessionTime: 'Data not available',
    };
  },

  getSessionData: async (): Promise<SessionData[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Generate timeline for last 24 hours
    const timeline: SessionData[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      timeline.push({
        time: hourStr,
        activeSessions: 0,
        newSessions: 0,
      });
    }

    return timeline;
  },

  getUsers: async (searchTerm?: string): Promise<User[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    const transformedUsers: User[] = data.map(session => ({
      id: session.id,
      email: profileData?.email || 'Data not available',
      deviceType: session.device_type || 'Data not available',
      ipAddress: 'Data not available',
      location: session.location || 'Data not available',
      deviceFingerprint: 'Data not available',
      sessionStart: new Date(session.started_at).toLocaleString(),
      riskScore: Number(session.risk_score) || 0,
      status: session.risk_score > 70 ? 'high-risk' : session.risk_score > 40 ? 'suspicious' : 'normal',
      anomalies: [],
      activityLevel: session.actions_taken > 50 ? 'high' : session.actions_taken > 20 ? 'medium' : 'low',
      lastActivity: session.ended_at ? new Date(session.ended_at).toLocaleString() : 'Active',
    }));

    if (searchTerm) {
      return transformedUsers.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return transformedUsers;
  },
};
