import { API_KEYS, API_BASE_URLS } from '../config/apiKeys';

export interface ThreatIntelligenceData {
  ip: string;
  shodan?: ShodanData;
  censys?: CensysData;
  greynoise?: GreyNoiseData;
  alienvault?: AlienVaultData;
  ipapi?: IPAPIData;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  classification: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  lastUpdated: number;
  sources: string[];
}

export interface ShodanData {
  ip: string;
  port: number;
  protocol: string;
  product: string;
  version: string;
  banner: string;
  hostnames: string[];
  domains: string[];
  os: string;
  org: string;
  isp: string;
  asn: string;
  location: {
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  vulns: string[];
  tags: string[];
  lastUpdate: string;
}

export interface CensysData {
  ip: string;
  services: Array<{
    port: number;
    service_name: string;
    transport_protocol: string;
    certificate?: any;
  }>;
  location: {
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  autonomous_system: {
    asn: number;
    name: string;
    country: string;
  };
  last_updated_at: string;
}

export interface GreyNoiseData {
  ip: string;
  noise: boolean;
  riot: boolean;
  classification: string;
  name: string;
  link: string;
  last_seen: string;
  tags: string[];
  cve: string[];
  raw_data: any;
}

export interface AlienVaultData {
  ip: string;
  reputation: number;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  pulse_info: {
    count: number;
    pulses: Array<{
      id: string;
      name: string;
      tags: string[];
      references: string[];
    }>;
  };
  validation: {
    ipv4: boolean;
    ipv6: boolean;
  };
  last_updated: string;
}

export interface IPAPIData {
  ip: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  asn: string;
  isp: string;
  organization: string;
  postal: string;
  currency: string;
  calling_code: string;
  flag: string;
  connection: {
    asn: number;
    isp: string;
  };
  security: {
    is_proxy: boolean;
    is_vpn: boolean;
    is_tor: boolean;
    is_hosting: boolean;
  };
}

class ThreatIntelligenceService {
  private static instance: ThreatIntelligenceService;
  private cache = new Map<string, ThreatIntelligenceData>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ThreatIntelligenceService {
    if (!ThreatIntelligenceService.instance) {
      ThreatIntelligenceService.instance = new ThreatIntelligenceService();
    }
    return ThreatIntelligenceService.instance;
  }

  async getThreatIntelligence(ip: string): Promise<ThreatIntelligenceData> {
    // Check cache first
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.lastUpdated < this.CACHE_TTL) {
      console.log('📋 Using cached threat intelligence for IP:', ip);
      return cached;
    }

    console.log('🔍 Fetching fresh threat intelligence for IP:', ip);

    try {
      // Fetch data from all APIs in parallel
      const [shodan, censys, greynoise, alienvault, ipapi] = await Promise.allSettled([
        this.fetchShodanData(ip),
        this.fetchCensysData(ip),
        this.fetchGreyNoiseData(ip),
        this.fetchAlienVaultData(ip),
        this.fetchIPAPIData(ip)
      ]);

      const threatData: ThreatIntelligenceData = {
        ip,
        shodan: shodan.status === 'fulfilled' ? shodan.value : undefined,
        censys: censys.status === 'fulfilled' ? censys.value : undefined,
        greynoise: greynoise.status === 'fulfilled' ? greynoise.value : undefined,
        alienvault: alienvault.status === 'fulfilled' ? alienvault.value : undefined,
        ipapi: ipapi.status === 'fulfilled' ? ipapi.value : undefined,
        riskScore: 0,
        riskLevel: 'low',
        classification: 'unknown',
        lastUpdated: Date.now(),
        sources: []
      };

      // Calculate risk score and classification
      this.calculateRiskScore(threatData);

      // Cache the result
      this.cache.set(ip, threatData);

      return threatData;
    } catch (error) {
      console.error('❌ Failed to fetch threat intelligence:', error);
      throw error;
    }
  }

  private async fetchShodanData(ip: string): Promise<ShodanData | null> {
    try {
      const response = await fetch(`${API_BASE_URLS.SHODAN}/shodan/host/${ip}?key=${API_KEYS.SHODAN_API_KEY}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Shodan API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Shodan data fetched for IP:', ip);

      return {
        ip: data.ip_str,
        port: data.port || 0,
        protocol: data.protocol || 'unknown',
        product: data.product || 'unknown',
        version: data.version || 'unknown',
        banner: data.banner || '',
        hostnames: data.hostnames || [],
        domains: data.domains || [],
        os: data.os || 'unknown',
        org: data.org || 'unknown',
        isp: data.isp || 'unknown',
        asn: data.asn || 'unknown',
        location: {
          city: data.city || 'unknown',
          region: data.region_name || 'unknown',
          country: data.country_name || 'unknown',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0
        },
        vulns: data.vulns || [],
        tags: data.tags || [],
        lastUpdate: data.last_update || new Date().toISOString()
      };
    } catch (error) {
      console.warn('⚠️ Shodan API failed:', error);
      return null;
    }
  }

  private async fetchCensysData(ip: string): Promise<CensysData | null> {
    try {
      const credentials = btoa(`${API_KEYS.CENSYS_API_ID}:${API_KEYS.CENSYS_API_SECRET}`);
      
      const response = await fetch(`${API_BASE_URLS.CENSYS}/v2/hosts/${ip}`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Censys API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Censys data fetched for IP:', ip);

      return {
        ip: data.ip,
        services: data.services || [],
        location: {
          city: data.location?.city || 'unknown',
          region: data.location?.province || 'unknown',
          country: data.location?.country || 'unknown',
          latitude: data.location?.coordinates?.latitude || 0,
          longitude: data.location?.coordinates?.longitude || 0
        },
        autonomous_system: {
          asn: data.autonomous_system?.asn || 0,
          name: data.autonomous_system?.name || 'unknown',
          country: data.autonomous_system?.country || 'unknown'
        },
        last_updated_at: data.last_updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.warn('⚠️ Censys API failed:', error);
      return null;
    }
  }

  private async fetchGreyNoiseData(ip: string): Promise<GreyNoiseData | null> {
    try {
      if (!API_KEYS.GREYNOISE_API_KEY) {
        console.warn('⚠️ GreyNoise API key not configured');
        return null;
      }

      const response = await fetch(`${API_BASE_URLS.GREYNOISE}/v3/community/${ip}`, {
        headers: {
          'key': API_KEYS.GREYNOISE_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`GreyNoise API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ GreyNoise data fetched for IP:', ip);

      return {
        ip: data.ip,
        noise: data.noise || false,
        riot: data.riot || false,
        classification: data.classification || 'unknown',
        name: data.name || 'unknown',
        link: data.link || '',
        last_seen: data.last_seen || new Date().toISOString(),
        tags: data.tags || [],
        cve: data.cve || [],
        raw_data: data
      };
    } catch (error) {
      console.warn('⚠️ GreyNoise API failed:', error);
      return null;
    }
  }

  private async fetchAlienVaultData(ip: string): Promise<AlienVaultData | null> {
    try {
      const response = await fetch(`${API_BASE_URLS.ALIENVAULT_OTX}/indicators/IPv4/${ip}`, {
        headers: {
          'X-OTX-API-KEY': API_KEYS.ALIENVAULT_OTX_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`AlienVault OTX API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AlienVault OTX data fetched for IP:', ip);

      return {
        ip: data.indicator,
        reputation: data.reputation || 0,
        country: data.country_name || 'unknown',
        city: data.city || 'unknown',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        pulse_info: {
          count: data.pulse_info?.count || 0,
          pulses: data.pulse_info?.pulses || []
        },
        validation: {
          ipv4: data.validation?.ipv4 || false,
          ipv6: data.validation?.ipv6 || false
        },
        last_updated: data.last_updated || new Date().toISOString()
      };
    } catch (error) {
      console.warn('⚠️ AlienVault OTX API failed:', error);
      return null;
    }
  }

  private async fetchIPAPIData(ip: string): Promise<IPAPIData | null> {
    try {
      const response = await fetch(`${API_BASE_URLS.IPAPI}/${ip}/json/`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`IPAPI error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ IPAPI data fetched for IP:', ip);

      return {
        ip: data.ip,
        city: data.city || 'unknown',
        region: data.region || 'unknown',
        country: data.country_name || 'unknown',
        country_code: data.country_code || 'unknown',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        timezone: data.timezone || 'unknown',
        asn: data.asn || 'unknown',
        isp: data.isp || 'unknown',
        organization: data.org || 'unknown',
        postal: data.postal || 'unknown',
        currency: data.currency || 'unknown',
        calling_code: data.calling_code || 'unknown',
        flag: data.flag || 'unknown',
        connection: {
          asn: data.connection?.asn || 0,
          isp: data.connection?.isp || 'unknown'
        },
        security: {
          is_proxy: data.security?.is_proxy || false,
          is_vpn: data.security?.is_vpn || false,
          is_tor: data.security?.is_tor || false,
          is_hosting: data.security?.is_hosting || false
        }
      };
    } catch (error) {
      console.warn('⚠️ IPAPI failed:', error);
      return null;
    }
  }

  private calculateRiskScore(threatData: ThreatIntelligenceData): void {
    let riskScore = 0;
    const sources: string[] = [];

    // Shodan analysis
    if (threatData.shodan) {
      sources.push('Shodan');
      if (threatData.shodan.vulns.length > 0) riskScore += 30;
      if (threatData.shodan.tags.includes('malicious')) riskScore += 40;
      if (threatData.shodan.tags.includes('botnet')) riskScore += 50;
      if (threatData.shodan.tags.includes('malware')) riskScore += 60;
    }

    // Censys analysis
    if (threatData.censys) {
      sources.push('Censys');
      if (threatData.censys.services.length > 10) riskScore += 10; // Many open ports
    }

    // GreyNoise analysis
    if (threatData.greynoise) {
      sources.push('GreyNoise');
      if (threatData.greynoise.noise) riskScore += 20;
      if (threatData.greynoise.classification === 'malicious') riskScore += 50;
      if (threatData.greynoise.cve.length > 0) riskScore += 25;
    }

    // AlienVault analysis
    if (threatData.alienvault) {
      sources.push('AlienVault');
      if (threatData.alienvault.reputation < 0) riskScore += 30;
      if (threatData.alienvault.pulse_info.count > 5) riskScore += 20;
    }

    // IPAPI security analysis
    if (threatData.ipapi) {
      sources.push('IPAPI');
      if (threatData.ipapi.security.is_proxy) riskScore += 15;
      if (threatData.ipapi.security.is_vpn) riskScore += 10;
      if (threatData.ipapi.security.is_tor) riskScore += 40;
      if (threatData.ipapi.security.is_hosting) riskScore += 5;
    }

    // Determine risk level and classification
    if (riskScore >= 80) {
      threatData.riskLevel = 'critical';
      threatData.classification = 'malicious';
    } else if (riskScore >= 50) {
      threatData.riskLevel = 'high';
      threatData.classification = 'malicious';
    } else if (riskScore >= 25) {
      threatData.riskLevel = 'medium';
      threatData.classification = 'suspicious';
    } else if (riskScore >= 10) {
      threatData.riskLevel = 'low';
      threatData.classification = 'benign';
    } else {
      threatData.riskLevel = 'low';
      threatData.classification = 'benign';
    }

    threatData.riskScore = Math.min(100, riskScore);
    threatData.sources = sources;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const threatIntelligenceService = ThreatIntelligenceService.getInstance();
