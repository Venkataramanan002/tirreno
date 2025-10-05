import { API_KEYS } from '../config/apiKeys';

export interface PhoneValidationResult {
  phone: string;
  isValid: boolean;
  isMobile: boolean;
  carrier?: string;
  country?: string;
  countryCode?: string;
  lineType?: string;
  location?: string;
  timezone?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface AbstractPhoneResponse {
  phone: string;
  valid: boolean;
  format: {
    international: string;
    national: string;
    e164: string;
  };
  country: {
    code: string;
    name: string;
    prefix: string;
  };
  location: string;
  type: string;
  carrier: string;
}

export class PhoneValidationService {
  static async validatePhone(phone: string): Promise<PhoneValidationResult> {
    console.log('📱 Validating phone number:', phone);

    try {
      const response = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=${API_KEYS.ABSTRACT_PHONE_VALIDATION}&phone=${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; SecurityAnalysis/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`Phone validation API error: ${response.status}`);
      }

      const data: AbstractPhoneResponse = await response.json();
      console.log('✅ Phone validation API success:', data);

      const riskScore = this.calculatePhoneRiskScore(data);
      const riskLevel = this.determineRiskLevel(riskScore);
      const recommendations = this.generateRecommendations(data, riskLevel);

      return {
        phone: data.phone,
        isValid: data.valid,
        isMobile: data.type === 'mobile',
        carrier: data.carrier || 'Unknown',
        country: data.country.name || 'Unknown',
        countryCode: data.country.code || 'Unknown',
        lineType: data.type || 'Unknown',
        location: data.location || 'Unknown',
        timezone: this.getTimezoneFromCountry(data.country.code),
        riskScore,
        riskLevel,
        recommendations
      };

    } catch (error) {
      console.error('❌ Phone validation failed:', error);
      
      // Fallback validation
      return {
        phone,
        isValid: this.basicPhoneValidation(phone),
        isMobile: false,
        carrier: 'Unknown',
        country: 'Unknown',
        countryCode: 'Unknown',
        lineType: 'Unknown',
        location: 'Unknown',
        timezone: 'Unknown',
        riskScore: 50,
        riskLevel: 'medium',
        recommendations: ['Unable to validate phone number - manual verification recommended']
      };
    }
  }

  private static calculatePhoneRiskScore(data: AbstractPhoneResponse): number {
    let score = 10; // Base score

    if (!data.valid) {
      score = 90; // Invalid phone
    } else {
      // Check for suspicious countries
      const suspiciousCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
      if (suspiciousCountries.includes(data.country.code)) {
        score += 30;
      }

      // Check for VoIP numbers (higher risk)
      if (data.type === 'voip') {
        score += 25;
      }

      // Check for landline (lower risk)
      if (data.type === 'landline') {
        score -= 10;
      }

      // Check for mobile (neutral)
      if (data.type === 'mobile') {
        score += 5;
      }

      // Check for unknown carrier
      if (!data.carrier || data.carrier.toLowerCase().includes('unknown')) {
        score += 15;
      }

      // Check for suspicious carriers
      const suspiciousCarriers = ['tor', 'vpn', 'proxy', 'virtual'];
      if (data.carrier && suspiciousCarriers.some(keyword => 
        data.carrier.toLowerCase().includes(keyword)
      )) {
        score += 35;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  private static determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private static generateRecommendations(data: AbstractPhoneResponse, riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (!data.valid) {
      recommendations.push('🚨 Invalid phone number format - verify the number');
      recommendations.push('📞 Request a valid phone number for verification');
    } else {
      if (riskLevel === 'critical') {
        recommendations.push('🚨 High-risk phone number detected');
        recommendations.push('🔐 Require additional verification methods');
        recommendations.push('👀 Monitor this number for suspicious activity');
      } else if (riskLevel === 'high') {
        recommendations.push('⚠️ Suspicious phone number characteristics');
        recommendations.push('🔐 Enable additional security measures');
        recommendations.push('📋 Document verification process');
      } else if (riskLevel === 'medium') {
        recommendations.push('📋 Standard verification procedures');
        recommendations.push('👀 Monitor for unusual activity');
      } else {
        recommendations.push('✅ Phone number appears legitimate');
        recommendations.push('📋 Follow standard verification procedures');
      }

      if (data.type === 'voip') {
        recommendations.push('📞 VoIP number detected - consider additional verification');
      }

      if (data.carrier && data.carrier.toLowerCase().includes('unknown')) {
        recommendations.push('❓ Unknown carrier - manual verification recommended');
      }
    }

    return recommendations;
  }

  private static basicPhoneValidation(phone: string): boolean {
    // Basic regex validation for international phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private static getTimezoneFromCountry(countryCode: string): string {
    const timezoneMap: { [key: string]: string } = {
      'US': 'America/New_York',
      'GB': 'Europe/London',
      'DE': 'Europe/Berlin',
      'FR': 'Europe/Paris',
      'JP': 'Asia/Tokyo',
      'AU': 'Australia/Sydney',
      'CA': 'America/Toronto',
      'IN': 'Asia/Kolkata',
      'CN': 'Asia/Shanghai',
      'RU': 'Europe/Moscow',
      'BR': 'America/Sao_Paulo',
      'MX': 'America/Mexico_City'
    };
    return timezoneMap[countryCode] || 'UTC';
  }
}
