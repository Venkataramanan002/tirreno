import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source: string;
  event: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'critical';
  user: string;
  ipAddress: string;
  location: string;
}

export interface EventFilters {
  search?: string;
  severity?: 'all' | 'high' | 'medium' | 'low' | 'critical';
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export const securityEventsApi = {
  getEvents: async (filters?: EventFilters): Promise<SecurityEvent[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('security_events')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (filters?.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    return data.map(event => ({
      id: event.id,
      timestamp: new Date(event.timestamp).toLocaleString(),
      source: 'System',
      event: event.event_type,
      description: event.description || 'Data not available',
      severity: event.severity as 'high' | 'medium' | 'low' | 'critical',
      user: profileData?.email || 'Data not available',
      ipAddress: event.ip_address || 'Data not available',
      location: event.location || 'Data not available',
    }));
  },
  
  getEventById: async (eventId: string): Promise<SecurityEvent> => {
    const events = await securityEventsApi.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    return event;
  },
  
  updateEventStatus: async (eventId: string, status: string): Promise<SecurityEvent> => {
    console.log(`Updating event ${eventId} status to ${status}`);
    return securityEventsApi.getEventById(eventId);
  },
};
