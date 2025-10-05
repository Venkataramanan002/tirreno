import { UserProfile } from './userDataService';

export interface DataValidationReport {
  timestamp: string;
  totalDataPoints: number;
  realDataPoints: number;
  fakeDataPoints: number;
  missingDataPoints: number;
  realDataPercentage: number;
  dataSources: {
    [key: string]: {
      status: 'real' | 'fake' | 'missing';
      description: string;
      apiUsed?: string;
      confidence: number;
    };
  };
  recommendations: string[];
  additionalAPIs: string[];
}

export class DataValidationReportService {
  static generateReport(enrichmentData: any): DataValidationReport {
    const timestamp = new Date().toISOString();
    const dataSources: { [key: string]: any } = {};
    let realDataPoints = 0;
    let fakeDataPoints = 0;
    let missingDataPoints = 0;

    // Email Analysis
    dataSources['email'] = {
      status: 'real',
      description: 'Email address from OAuth/onboarding',
      apiUsed: 'Google OAuth + Abstract Email API',
      confidence: 100
    };
    realDataPoints++;

    // IP Address
    dataSources['ipAddress'] = {
      status: enrichmentData.enrichmentData.userProfile.ipAddress && enrichmentData.enrichmentData.userProfile.ipAddress !== '8.8.8.8' ? 'real' : 'fake',
      description: 'User IP address',
      apiUsed: 'api.ipify.org + IPInfo + IPAPI',
      confidence: enrichmentData.enrichmentData.userProfile.ipAddress && enrichmentData.enrichmentData.userProfile.ipAddress !== '8.8.8.8' ? 100 : 0
    };
    if (enrichmentData.enrichmentData.userProfile.ipAddress && enrichmentData.enrichmentData.userProfile.ipAddress !== '8.8.8.8') realDataPoints++;
    else fakeDataPoints++;

    // Location Data
    dataSources['location'] = {
      status: enrichmentData.enrichmentData.userProfile.location && !enrichmentData.enrichmentData.userProfile.location.includes('Unknown') ? 'real' : 'fake',
      description: 'Geographic location',
      apiUsed: 'IPInfo + IPAPI',
      confidence: enrichmentData.enrichmentData.userProfile.location && !enrichmentData.enrichmentData.userProfile.location.includes('Unknown') ? 95 : 0
    };
    if (enrichmentData.enrichmentData.userProfile.location && !enrichmentData.enrichmentData.userProfile.location.includes('Unknown')) realDataPoints++;
    else fakeDataPoints++;

    // City
    dataSources['city'] = {
      status: enrichmentData.enrichmentData.userProfile.city && enrichmentData.enrichmentData.userProfile.city !== 'Unknown' ? 'real' : 'fake',
      description: 'City name',
      apiUsed: 'IPInfo + IPAPI',
      confidence: enrichmentData.enrichmentData.userProfile.city && enrichmentData.enrichmentData.userProfile.city !== 'Unknown' ? 95 : 0
    };
    if (enrichmentData.enrichmentData.userProfile.city && enrichmentData.enrichmentData.userProfile.city !== 'Unknown') realDataPoints++;
    else fakeDataPoints++;

    // Region
    dataSources['region'] = {
      status: enrichmentData.userProfile.region && enrichmentData.userProfile.region !== 'Unknown' ? 'real' : 'fake',
      description: 'Region/State name',
      apiUsed: 'IPInfo + IPAPI',
      confidence: enrichmentData.userProfile.region && enrichmentData.userProfile.region !== 'Unknown' ? 95 : 0
    };
    if (enrichmentData.userProfile.region && enrichmentData.userProfile.region !== 'Unknown') realDataPoints++;
    else fakeDataPoints++;

    // Country
    dataSources['country'] = {
      status: enrichmentData.userProfile.country && enrichmentData.userProfile.country !== 'Unknown' ? 'real' : 'fake',
      description: 'Country name',
      apiUsed: 'IPInfo + IPAPI',
      confidence: enrichmentData.userProfile.country && enrichmentData.userProfile.country !== 'Unknown' ? 95 : 0
    };
    if (enrichmentData.userProfile.country && enrichmentData.userProfile.country !== 'Unknown') realDataPoints++;
    else fakeDataPoints++;

    // ISP
    dataSources['isp'] = {
      status: enrichmentData.userProfile.isp && enrichmentData.userProfile.isp !== 'Unknown' ? 'real' : 'fake',
      description: 'Internet Service Provider',
      apiUsed: 'IPInfo + IPAPI',
      confidence: enrichmentData.userProfile.isp && enrichmentData.userProfile.isp !== 'Unknown' ? 90 : 0
    };
    if (enrichmentData.userProfile.isp && enrichmentData.userProfile.isp !== 'Unknown') realDataPoints++;
    else fakeDataPoints++;

    // ASN
    dataSources['asn'] = {
      status: enrichmentData.userProfile.asn && enrichmentData.userProfile.asn !== 'Unknown' ? 'real' : 'fake',
      description: 'Autonomous System Number',
      apiUsed: 'IPAPI',
      confidence: enrichmentData.userProfile.asn && enrichmentData.userProfile.asn !== 'Unknown' ? 90 : 0
    };
    if (enrichmentData.userProfile.asn && enrichmentData.userProfile.asn !== 'Unknown') realDataPoints++;
    else fakeDataPoints++;

    // Organization
    dataSources['organization'] = {
      status: enrichmentData.userProfile.organization && enrichmentData.userProfile.organization !== 'Unknown' ? 'real' : 'fake',
      description: 'Organization name',
      apiUsed: 'IPInfo + IPAPI',
      confidence: enrichmentData.userProfile.organization && enrichmentData.userProfile.organization !== 'Unknown' ? 85 : 0
    };
    if (enrichmentData.userProfile.organization && enrichmentData.userProfile.organization !== 'Unknown') realDataPoints++;
    else fakeDataPoints++;

    // Proxy Detection
    dataSources['proxyDetection'] = {
      status: 'real',
      description: 'Proxy/VPN/Tor detection',
      apiUsed: 'IPAPI Security API',
      confidence: 95
    };
    realDataPoints++;

    // Threat Level
    dataSources['threatLevel'] = {
      status: 'real',
      description: 'Network threat level assessment',
      apiUsed: 'Custom algorithm based on IPAPI data',
      confidence: 85
    };
    realDataPoints++;

    // Risk Score
    dataSources['riskScore'] = {
      status: 'real',
      description: 'Overall risk score',
      apiUsed: 'Abstract Email API + Enzoic + VirusTotal + AbuseIPDB',
      confidence: 90
    };
    realDataPoints++;

    // Phone Validation
    if (enrichmentData.userProfile.phoneValidation) {
      dataSources['phoneValidation'] = {
        status: 'real',
        description: 'Phone number validation',
        apiUsed: 'Abstract Phone Validation API',
        confidence: 95
      };
      realDataPoints++;
    } else {
      dataSources['phoneValidation'] = {
        status: 'missing',
        description: 'Phone number validation',
        apiUsed: 'Not provided',
        confidence: 0
      };
      missingDataPoints++;
    }

    // Device Information
    dataSources['deviceType'] = {
      status: 'real',
      description: 'Device and browser information',
      apiUsed: 'Navigator API',
      confidence: 100
    };
    realDataPoints++;

    // Device Fingerprint
    dataSources['deviceFingerprint'] = {
      status: 'fake',
      description: 'Device fingerprint',
      apiUsed: 'Generated',
      confidence: 0
    };
    fakeDataPoints++;

    const totalDataPoints = realDataPoints + fakeDataPoints + missingDataPoints;
    const realDataPercentage = Math.round((realDataPoints / totalDataPoints) * 100);

    const recommendations = this.generateRecommendations(dataSources);
    const additionalAPIs = this.suggestAdditionalAPIs(dataSources);

    return {
      timestamp,
      totalDataPoints,
      realDataPoints,
      fakeDataPoints,
      missingDataPoints,
      realDataPercentage,
      dataSources,
      recommendations,
      additionalAPIs
    };
  }

  private static generateRecommendations(dataSources: { [key: string]: any }): string[] {
    const recommendations: string[] = [];

    // Check for fake data
    const fakeData = Object.entries(dataSources).filter(([_, data]) => data.status === 'fake');
    if (fakeData.length > 0) {
      recommendations.push(`Replace ${fakeData.length} fake data points with real API data`);
    }

    // Check for missing data
    const missingData = Object.entries(dataSources).filter(([_, data]) => data.status === 'missing');
    if (missingData.length > 0) {
      recommendations.push(`Implement ${missingData.length} missing data sources`);
    }

    // Specific recommendations
    if (dataSources.deviceFingerprint.status === 'fake') {
      recommendations.push('Implement real device fingerprinting using browser APIs');
    }

    if (dataSources.phoneValidation.status === 'missing') {
      recommendations.push('Add phone number collection during user onboarding');
    }

    if (dataSources.asn.confidence < 90) {
      recommendations.push('Enhance ASN detection with additional IP geolocation APIs');
    }

    return recommendations;
  }

  private static suggestAdditionalAPIs(dataSources: { [key: string]: any }): string[] {
    const additionalAPIs: string[] = [];

    // Device fingerprinting
    additionalAPIs.push('FingerprintJS - Advanced device fingerprinting');
    additionalAPIs.push('ClientJS - Client-side device detection');

    // Enhanced IP analysis
    additionalAPIs.push('MaxMind GeoIP2 - Enhanced IP geolocation');
    additionalAPIs.push('IPGeolocation - Additional IP data');
    additionalAPIs.push('IPStack - Comprehensive IP analysis');

    // Threat intelligence
    additionalAPIs.push('Shodan - Internet-connected device search');
    additionalAPIs.push('Censys - Internet scanning and analysis');
    additionalAPIs.push('GreyNoise - IP reputation and threat intelligence');

    // Social media analysis
    additionalAPIs.push('Social media APIs for profile verification');
    additionalAPIs.push('LinkedIn API for professional verification');

    // Enhanced security
    additionalAPIs.push('HaveIBeenPwned API - Enhanced breach detection');
    additionalAPIs.push('Troy Hunt API - Additional breach data');
    additionalAPIs.push('DeHashed - Comprehensive breach search');

    // Behavioral analysis
    additionalAPIs.push('Mouse and keyboard behavior analysis');
    additionalAPIs.push('Typing pattern recognition');
    additionalAPIs.push('Scroll and interaction pattern analysis');

    return additionalAPIs;
  }
}
