import { API_KEYS } from '../config/apiKeys';

export interface UserNetworkInfo {
  ip: string;
  location?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  asn?: string;
  asnName?: string;
  organization?: string;
  isProxy?: boolean;
  isVpn?: boolean;
  isTor?: boolean;
  isHosting?: boolean;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  resolvedAt: number;
}

interface IPInfoResponse {
  ip: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  org: string;
  timezone: string;
  hostname?: string;
  bogon?: boolean;
}

interface IPAPIResponse {
  ip: string;
  city: string;
  region_name: string;
  country_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  asn: string;
  isp: string;
  organization: string;
  security: {
    is_proxy: boolean;
    is_vpn: boolean;
    is_tor: boolean;
    is_hosting: boolean;
  };
}

const CACHE_KEY = 'userNetworkInfoCacheV2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Define fetchers for IP and location data
const fetchers = {
  async getIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP:', error);
      return '192.168.1.1'; // Fallback IP
    }
  },
  
  async getLocation(ip: string): Promise<string> {
    try {
      const response = await fetch(`https://ipinfo.io/${ip}/json?token=${API_KEYS.IPINFO_TOKEN}`);
      const data = await response.json();
      return `${data.city}, ${data.region}, ${data.country}`;
    } catch (error) {
      console.error('Error fetching location:', error);
      return 'Unknown Location';
    }
  }
};

export const ipService = {
  async getIPData(forceReal = false): Promise<any> {
    try {
      // Try to get from cache first, unless forceReal is true
      const cachedData = localStorage.getItem('ipData');
      if (!forceReal && cachedData) {
        const parsedData = JSON.parse(cachedData);
        // Check if data is less than 1 hour old
        if (parsedData.timestamp && (Date.now() - parsedData.timestamp < 3600000)) {
          return parsedData;
        }
      }

      const ip = await fetchers.getIP();
      let location: string | undefined = undefined;
      try {
        location = await fetchers.getLocation(ip);
      } catch {}

      const info: UserNetworkInfo = { ip, location, resolvedAt: Date.now() };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(info));
      } catch {}
      return info;
    } catch (error) {
      console.error("Error fetching IP data:", error);
      return null;
    }
  }
};

export async function getComprehensiveNetworkInfo(ip: string): Promise<UserNetworkInfo> {
  try {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cached: UserNetworkInfo = JSON.parse(cachedRaw);
      if (Date.now() - cached.resolvedAt < CACHE_TTL_MS && cached.ip === ip) {
        return cached;
      }
    }
  } catch {}

  console.log('🌐 Fetching comprehensive network info for IP:', ip);

  // Fetch from both IPInfo and IPAPI for comprehensive data
  const [ipInfoData, ipApiData] = await Promise.allSettled([
    fetchIPInfoData(ip),
    fetchIPAPIData(ip)
  ]);

  const ipInfo = ipInfoData.status === 'fulfilled' ? ipInfoData.value : null;
  const ipApi = ipApiData.status === 'fulfilled' ? ipApiData.value : null;

  // Combine data from both sources, prioritizing IPAPI for more detailed info
  const networkInfo: UserNetworkInfo = {
    ip,
    city: ipApi?.city || ipInfo?.city || 'Unknown',
    region: ipApi?.region_name || ipInfo?.region || 'Unknown',
    country: ipApi?.country_name || ipInfo?.country || 'Unknown',
    countryCode: ipApi?.country_code || 'Unknown',
    latitude: ipApi?.latitude || (ipInfo?.loc ? parseFloat(ipInfo.loc.split(',')[0]) : undefined),
    longitude: ipApi?.longitude || (ipInfo?.loc ? parseFloat(ipInfo.loc.split(',')[1]) : undefined),
    timezone: ipApi?.timezone || ipInfo?.timezone || 'Unknown',
    isp: ipApi?.isp || ipInfo?.org || 'Unknown',
    asn: ipApi?.asn || 'Unknown',
    asnName: ipApi?.organization || 'Unknown',
    organization: ipApi?.organization || ipInfo?.org || 'Unknown',
    isProxy: ipApi?.security?.is_proxy || false,
    isVpn: ipApi?.security?.is_vpn || false,
    isTor: ipApi?.security?.is_tor || false,
    isHosting: ipApi?.security?.is_hosting || false,
    threatLevel: determineThreatLevel(ipApi, ipInfo),
    resolvedAt: Date.now()
  };

  // Create location string
  networkInfo.location = `${networkInfo.city}, ${networkInfo.region}, ${networkInfo.country}`;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(networkInfo));
  } catch {}

  console.log('✅ Comprehensive network info loaded:', networkInfo);
  return networkInfo;
}

async function fetchIPInfoData(ip: string): Promise<IPInfoResponse | null> {
  try {
    const response = await fetch(`https://ipinfo.io/${ip}?token=${API_KEYS.IPINFO_TOKEN}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('IPInfo API failed:', error);
    return null;
  }
}

async function fetchIPAPIData(ip: string): Promise<IPAPIResponse | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/?key=${API_KEYS.IPAPI_KEY}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('IPAPI failed:', error);
    return null;
  }
}

function determineThreatLevel(ipApi: IPAPIResponse | null, ipInfo: IPInfoResponse | null): 'low' | 'medium' | 'high' | 'critical' {
  if (!ipApi && !ipInfo) return 'medium';

  let threatScore = 0;

  // Check for proxy/VPN/Tor
  if (ipApi?.security) {
    if (ipApi.security.is_tor) threatScore += 40;
    if (ipApi.security.is_vpn) threatScore += 20;
    if (ipApi.security.is_proxy) threatScore += 15;
    if (ipApi.security.is_hosting) threatScore += 10;
  }

  // Check for suspicious countries
  if (ipApi?.country_code || ipInfo?.country) {
    const countryCode = ipApi?.country_code || ipInfo?.country;
    if (['CN', 'RU', 'KP', 'IR'].includes(countryCode)) {
      threatScore += 25;
    }
  }

  // Check for suspicious ISPs
  if (ipApi?.isp || ipInfo?.org) {
    const isp = (ipApi?.isp || ipInfo?.org).toLowerCase();
    if (isp.includes('tor') || isp.includes('vpn') || isp.includes('proxy')) {
      threatScore += 20;
    }
  }

  if (threatScore >= 60) return 'critical';
  if (threatScore >= 40) return 'high';
  if (threatScore >= 20) return 'medium';
  return 'low';
}


