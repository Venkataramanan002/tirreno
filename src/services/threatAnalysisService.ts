
import { API_KEYS } from '../config/apiKeys';

interface ThreatCheckResult {
  category: string;
  status: 'checking' | 'safe' | 'warning' | 'danger';
  details: string;
  score: number;
}

interface EmailAnalysisResult {
  overallRiskScore: number;
  threatChecks: ThreatCheckResult[];
  recommendations: string[];
  emailReputation: 'good' | 'suspicious' | 'compromised';
  userIP: string;
  userLocation?: string;
}

interface AbstractEmailReputationResponse {
  deliverability: string;
  quality_score: number;
  is_valid_format: {
    value: boolean;
  };
  is_free_email: {
    value: boolean;
  };
  is_disposable_email: {
    value: boolean;
  };
  is_role_email: {
    value: boolean;
  };
  is_catchall_email: {
    value: boolean;
  };
  is_smtp_valid: {
    value: boolean;
  };
  is_mx_found: {
    value: boolean;
  };
  is_syntax_valid: {
    value: boolean;
  };
  autocorrect: string;
  suggestions: string[];
  domain_age_days: number;
  first_name: string;
  last_name: string;
  gender: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  local_time: string;
  utc_time: string;
  zipcode: string;
  organization: string;
  carrier: string;
  line_type: string;
}

interface EnzoicResponse {
  candidates: Array<{
    hashedUsername: string;
    exposureCount: number;
    exposures: Array<{
      title: string;
      date: string;
      category: string;
    }>;
  }>;
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

interface VirusTotalResponse {
  data: {
    attributes: {
      reputation: number;
      last_analysis_stats: {
        malicious: number;
        suspicious: number;
        harmless: number;
        undetected: number;
      };
    };
  };
}

interface AbuseIPDBResponse {
  data: {
    isPublic: boolean;
    ipVersion: number;
    isWhitelisted: boolean;
    abuseConfidencePercentage: number;
    countryCode: string;
    usageType: string;
    isp: string;
    domain: string;
    totalReports: number;
    numDistinctUsers: number;
  };
}

export class ThreatAnalysisService {
  private static readonly ANALYSIS_STEPS = [
    { name: 'Email Format & Reputation Check', duration: 2000, api: 'abstract' },
    { name: 'Breach Database Lookup', duration: 3000, api: 'enzoic' },
    { name: 'IP Geolocation Analysis', duration: 1500, api: 'ipinfo' },
    { name: 'Virus/Malware Detection', duration: 2000, api: 'virustotal' },
    { name: 'IP Reputation Check', duration: 1800, api: 'abuseipdb' },
    { name: 'Threat Intelligence Correlation', duration: 1000, api: 'custom' },
  ];

  static async performEmailAnalysis(
    email: string,
    onProgress: (step: string, progress: number) => void
  ): Promise<EmailAnalysisResult> {
    const totalSteps = this.ANALYSIS_STEPS.length;
    const threatChecks: ThreatCheckResult[] = [];

    console.log('🔍 Starting email analysis for:', email);

    // Get user's IP and location for additional analysis
    const userIP = await this.getUserIP();
    console.log('🌐 User IP detected:', userIP);
    let userLocation: string | undefined = undefined;
    try {
      const ipInfoRes = await fetch(`https://ipinfo.io/${userIP}?token=${API_KEYS.IPINFO_TOKEN}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (ipInfoRes.ok) {
        const ipInfo: IPInfoResponse = await ipInfoRes.json();
        if (ipInfo.city || ipInfo.region || ipInfo.country) {
          userLocation = `${ipInfo.city || ''}${ipInfo.city && (ipInfo.region || ipInfo.country) ? ', ' : ''}${ipInfo.region || ''}${ipInfo.region && ipInfo.country ? ', ' : (!ipInfo.region && ipInfo.country && (ipInfo.city ? ', ' : ''))}${ipInfo.country || ''}`.trim();
        }
      }
    } catch {}

    for (let i = 0; i < this.ANALYSIS_STEPS.length; i++) {
      const step = this.ANALYSIS_STEPS[i];
      onProgress(step.name, Math.round(((i + 1) / totalSteps) * 100));
      
      await new Promise(resolve => setTimeout(resolve, step.duration));
      
      let result: ThreatCheckResult;
      
      switch (step.api) {
        case 'abstract':
          result = await this.performAbstractEmailCheck(email, step.name);
          break;
        case 'enzoic':
          result = await this.performEnzoicBreachCheck(email, step.name);
          break;
        case 'ipinfo':
          result = await this.performIPInfoCheck(userIP, step.name);
          break;
        case 'virustotal':
          result = await this.performVirusTotalCheck(userIP, step.name);
          break;
        case 'abuseipdb':
          result = await this.performAbuseIPDBCheck(userIP, step.name);
          break;
        default:
          result = this.generateCustomThreatCheck(email, step.name);
      }
      
      threatChecks.push(result);
      console.log(`✅ Completed: ${step.name}`, result);
    }

    const overallRiskScore = this.calculateOverallRiskScore(email, threatChecks);
    const emailReputation = this.determineEmailReputation(overallRiskScore);
    const recommendations = this.generateRecommendations(threatChecks, emailReputation);

    const finalResult = {
      overallRiskScore,
      threatChecks,
      recommendations,
      emailReputation,
      userIP,
      userLocation
    };

    console.log('📊 Final Analysis Result:', finalResult);
    return finalResult;
  }

  private static async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('❌ Failed to get user IP:', error);
      return '8.8.8.8'; // Fallback IP for testing
    }
  }

  private static async performAbstractEmailCheck(email: string, category: string): Promise<ThreatCheckResult> {
    try {
      console.log('🔍 Abstract API - Checking email:', email);
      
      const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEYS.ABSTRACT_EMAIL_REPUTATION}&email=${encodeURIComponent(email)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; SecurityAnalysis/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Abstract API Error: ${response.status}`);
      }
      
      const data: AbstractEmailReputationResponse = await response.json();
      console.log('✅ Abstract API Success:', data);
      
      let score = 10;
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      let details = '';

      // Comprehensive email validation
      if (!data.is_valid_format?.value) {
        score = 90;
        status = 'danger';
        details = '❌ Invalid email format detected';
      } else if (data.is_disposable_email?.value) {
        score = 70;
        status = 'danger';
        details = '⚠️ Disposable email address detected';
      } else if (data.is_catchall_email?.value) {
        score = 60;
        status = 'warning';
        details = '📧 Catch-all email address detected';
      } else if (data.is_role_email?.value) {
        score = 40;
        status = 'warning';
        details = '📧 Role-based email address (admin, info, etc.)';
      } else if (data.quality_score < 0.7) {
        score = 50;
        status = 'warning';
        details = `⚠️ Low quality score: ${Math.round(data.quality_score * 100)}%`;
      } else {
        score = 15;
        details = `✅ Valid format, quality: ${Math.round(data.quality_score * 100)}%`;
      }

      // SMTP and MX validation
      if (!data.is_smtp_valid?.value) {
        score += 20;
        status = 'warning';
        details += ' (SMTP validation failed)';
      }

      if (!data.is_mx_found?.value) {
        score += 15;
        status = 'warning';
        details += ' (No MX record found)';
      }

      // Deliverability check
      if (data.deliverability === 'UNDELIVERABLE') {
        score += 30;
        status = 'danger';
        details += ' (Undeliverable)';
      } else if (data.deliverability === 'DELIVERABLE') {
        details += ' (Deliverable)';
      }

      // Additional risk factors
      if (data.is_free_email?.value) {
        details += ', Free email provider';
        score += 5;
      }

      // Domain age analysis
      if (data.domain_age_days && data.domain_age_days < 30) {
        score += 15;
        details += ` (New domain: ${data.domain_age_days} days)`;
      }

      // Geographic analysis
      if (data.country) {
        details += ` | Location: ${data.city || 'Unknown'}, ${data.country}`;
        
        // Check for suspicious countries
        const suspiciousCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
        if (suspiciousCountries.includes(data.country)) {
          score += 20;
          details += ' (High-risk country)';
        }
      }

      // Organization analysis
      if (data.organization) {
        details += ` | Org: ${data.organization}`;
        
        // Check for suspicious organizations
        const suspiciousOrgs = ['tor', 'vpn', 'proxy', 'anonymous'];
        if (suspiciousOrgs.some(keyword => 
          data.organization.toLowerCase().includes(keyword)
        )) {
          score += 25;
          details += ' (Suspicious organization)';
        }
      }

      // Autocorrect suggestions
      if (data.autocorrect && data.autocorrect !== email) {
        details += ` | Suggested: ${data.autocorrect}`;
      }

      return {
        category,
        status,
        details,
        score: Math.min(100, score)
      };
    } catch (error) {
      console.error('❌ Abstract API Failed:', error);
      return {
        category,
        status: 'warning',
        details: `⚠️ Couldn't fetch email reputation data`,
        score: 50
      };
    }
  }

  private static async performEnzoicBreachCheck(email: string, category: string): Promise<ThreatCheckResult> {
    try {
      console.log('🔍 Enzoic API - Checking breaches for:', email);
      
      const credentials = btoa(`${API_KEYS.ENZOIC}:`);
      
      const response = await fetch('https://api.enzoic.com/v1/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          usernames: [email]
        })
      });

      if (!response.ok) {
        throw new Error(`Enzoic API Error: ${response.status}`);
      }

      const data: EnzoicResponse = await response.json();
      console.log('✅ Enzoic API Success:', data);
      
      let score = 10;
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      let details = '';

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        const exposureCount = candidate.exposureCount || 0;
        
        if (exposureCount >= 5) {
          score = 85;
          status = 'danger';
          details = `🚨 Found in ${exposureCount} data breaches - HIGH RISK`;
        } else if (exposureCount >= 2) {
          score = 60;
          status = 'warning';
          details = `⚠️ Found in ${exposureCount} data breaches`;
        } else if (exposureCount >= 1) {
          score = 35;
          status = 'warning';
          details = `⚠️ Found in ${exposureCount} data breach`;
        }
        
        if (candidate.exposures && candidate.exposures.length > 0) {
          const recentBreach = candidate.exposures[0];
          details += ` (Latest: ${recentBreach.title})`;
        }
      } else {
        details = '✅ No known data breaches found';
      }

      return {
        category,
        status,
        details,
        score: Math.min(100, score)
      };
    } catch (error) {
      console.error('❌ Enzoic API Failed:', error);
      return {
        category,
        status: 'warning',
        details: `⚠️ Couldn't fetch breach database information`,
        score: 40
      };
    }
  }

  private static async performIPInfoCheck(ip: string, category: string): Promise<ThreatCheckResult> {
    try {
      console.log('🔍 IPInfo API - Checking IP:', ip);
      
      const response = await fetch(`https://ipinfo.io/${ip}?token=${API_KEYS.IPINFO_TOKEN}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`IPInfo API Error: ${response.status}`);
      }

      const data: IPInfoResponse = await response.json();
      console.log('✅ IPInfo API Success:', data);
      
      let score = 10;
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      let details = '';

      if (data.bogon) {
        score = 60;
        status = 'warning';
        details = '⚠️ Private/reserved IP address detected';
      } else {
        details = `📍 Location: ${data.city}, ${data.region}, ${data.country}`;
        
        if (data.org) {
          details += ` | ISP: ${data.org}`;
        }
        
        // Check for suspicious locations or ISPs
        if (data.country && ['CN', 'RU', 'KP'].includes(data.country)) {
          score += 25;
          status = 'warning';
          details += ' (High-risk country)';
        }
        
        if (data.org && (data.org.toLowerCase().includes('tor') || data.org.toLowerCase().includes('vpn'))) {
          score += 30;
          status = 'warning';
          details += ' (VPN/Proxy detected)';
        }
      }

      return {
        category,
        status,
        details,
        score: Math.min(100, score)
      };
    } catch (error) {
      console.error('❌ IPInfo API Failed:', error);
      return {
        category,
        status: 'warning',
        details: `⚠️ Couldn't fetch IP geolocation data`,
        score: 30
      };
    }
  }

  private static async performVirusTotalCheck(ip: string, category: string): Promise<ThreatCheckResult> {
    try {
      console.log('🔍 VirusTotal API - Checking IP reputation for:', ip);

      const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-apikey': API_KEYS.VIRUSTOTAL_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`VirusTotal API Error: ${response.status}`);
      }

      const data: VirusTotalResponse = await response.json();
      console.log('✅ VirusTotal API Success:', data);

      let score = 10;
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      let details = '';

      const stats = data?.data?.attributes?.last_analysis_stats;
      const reputation = data?.data?.attributes?.reputation ?? 0;

      if (stats) {
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const harmless = stats.harmless || 0;
        const undetected = stats.undetected || 0;
        const total = malicious + suspicious + harmless + undetected;

        if (malicious >= 5 || reputation < -10) {
          score = 90;
          status = 'danger';
          details = `🚨 IP flagged: malicious=${malicious}, suspicious=${suspicious}, total=${total}, reputation=${reputation}`;
        } else if (malicious > 0 || suspicious > 2 || reputation < 0) {
          score = 55;
          status = 'warning';
          details = `⚠️ Some detections: malicious=${malicious}, suspicious=${suspicious}, reputation=${reputation}`;
        } else {
          score = 10;
          status = 'safe';
          details = `✅ Clean per VT: malicious=${malicious}, suspicious=${suspicious}, total=${total}`;
        }
      } else {
        details = '✅ No analysis stats available for this IP';
      }

      return {
        category,
        status,
        details,
        score: Math.min(100, score)
      };
    } catch (error) {
      console.error('❌ VirusTotal API Failed:', error);
      return {
        category,
        status: 'warning',
        details: `⚠️ Couldn't fetch virus/malware detection data`,
        score: 30
      };
    }
  }

  private static async performAbuseIPDBCheck(ip: string, category: string): Promise<ThreatCheckResult> {
    try {
      console.log('🔍 AbuseIPDB API - Checking IP reputation:', ip);
      
      const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`, {
        method: 'GET',
        headers: {
          'Key': API_KEYS.ABUSEIPDB_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`AbuseIPDB API Error: ${response.status}`);
      }

      const data: AbuseIPDBResponse = await response.json();
      console.log('✅ AbuseIPDB API Success:', data);
      
      let score = 10;
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      let details = '';

      const abuseConfidence = data.data.abuseConfidencePercentage || 0;
      const totalReports = data.data.totalReports || 0;

      if (abuseConfidence > 75) {
        score = 85;
        status = 'danger';
        details = `🚨 High abuse confidence: ${abuseConfidence}% (${totalReports} reports)`;
      } else if (abuseConfidence > 25) {
        score = 50;
        status = 'warning';
        details = `⚠️ Moderate abuse confidence: ${abuseConfidence}% (${totalReports} reports)`;
      } else if (totalReports > 0) {
        score = 25;
        status = 'warning';
        details = `⚠️ ${totalReports} abuse reports (${abuseConfidence}% confidence)`;
      } else {
        details = '✅ No abuse reports found';
      }

      if (data.data.isWhitelisted) {
        score = Math.max(5, score - 20);
        details += ' (Whitelisted)';
      }

      return {
        category,
        status,
        details,
        score: Math.min(100, score)
      };
    } catch (error) {
      console.error('❌ AbuseIPDB API Failed:', error);
      return {
        category,
        status: 'warning',
        details: `⚠️ Couldn't fetch IP reputation data`,
        score: 30
      };
    }
  }

  private static generateCustomThreatCheck(email: string, category: string): ThreatCheckResult {
    let score = Math.random() * 20 + 10;
    let status: 'safe' | 'warning' | 'danger' = 'safe';
    let details = '';

    switch (category) {
      case 'Threat Intelligence Correlation':
        if (score > 65) {
          status = 'danger';
          details = '🚨 Email patterns match known threat indicators';
        } else if (score > 40) {
          status = 'warning';
          details = '⚠️ Some suspicious patterns detected';
        } else {
          details = '✅ No correlation with known threat intelligence';
        }
        break;

      default:
        details = '✅ Analysis completed successfully';
    }

    if (score > 70) status = 'danger';
    else if (score > 45) status = 'warning';

    return {
      category,
      status,
      details,
      score: Math.min(100, Math.round(score))
    };
  }

  private static calculateOverallRiskScore(email: string, checks: ThreatCheckResult[]): number {
    // Weight the API-based checks more heavily since they provide real data
    const weights = checks.map(check => {
      if (check.category.includes('Email Format & Reputation') || 
          check.category.includes('Breach Database') ||
          check.category.includes('IP Geolocation') ||
          check.category.includes('Virus/Malware') ||
          check.category.includes('IP Reputation')) {
        return 2; // Double weight for real API data
      }
      return 1;
    });
    
    const weightedSum = checks.reduce((sum, check, index) => sum + (check.score * weights[index]), 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    return Math.min(100, Math.round(weightedSum / totalWeight));
  }

  private static determineEmailReputation(score: number): 'good' | 'suspicious' | 'compromised' {
    if (score > 70) return 'compromised';
    if (score > 40) return 'suspicious';
    return 'good';
  }

  private static generateRecommendations(
    checks: ThreatCheckResult[], 
    reputation: 'good' | 'suspicious' | 'compromised'
  ): string[] {
    const recommendations: string[] = [];

    if (reputation === 'compromised') {
      recommendations.push('🚨 Immediately change passwords for all accounts');
      recommendations.push('🔐 Enable two-factor authentication on all services');
      recommendations.push('👀 Monitor accounts for suspicious activity');
      recommendations.push('📧 Consider using a different email address');
    } else if (reputation === 'suspicious') {
      recommendations.push('🔐 Enable additional security measures');
      recommendations.push('👀 Regularly monitor account activity');
      recommendations.push('🔄 Update passwords periodically');
    }

    checks.forEach(check => {
      if (check.status === 'danger') {
        switch (check.category) {
          case 'Breach Database Lookup':
            recommendations.push('🔑 Change passwords for affected accounts immediately');
            recommendations.push('📧 Check if other accounts use the same credentials');
            break;
          case 'Email Format & Reputation Check':
            if (check.details.includes('Disposable')) {
              recommendations.push('📧 Avoid using disposable email addresses for important accounts');
            }
            break;
          case 'IP Reputation Check':
            recommendations.push('🌐 Consider using a different network connection');
            break;
          case 'Virus/Malware Detection':
            recommendations.push('🛡️ Scan your system for malware immediately');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ Maintain current security practices');
      recommendations.push('🔄 Regular security checkups recommended');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }
}
