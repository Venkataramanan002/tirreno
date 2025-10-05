import { API_KEYS } from '../config/apiKeys';

export interface MobileVerificationResult {
  phone: string;
  isValid: boolean;
  isMobile: boolean;
  carrier?: string;
  country?: string;
  countryCode?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  verificationCode?: string;
  expiresAt?: number;
}

export interface VerificationCodeResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
}

class MobileVerificationService {
  private static instance: MobileVerificationService;
  private verificationCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

  static getInstance(): MobileVerificationService {
    if (!MobileVerificationService.instance) {
      MobileVerificationService.instance = new MobileVerificationService();
    }
    return MobileVerificationService.instance;
  }

  async validatePhoneNumber(phoneNumber: string): Promise<MobileVerificationResult> {
    try {
      console.log('🔍 Validating phone number:', phoneNumber);

      const url = `https://phonevalidation.abstractapi.com/v1/?api_key=${API_KEYS.ABSTRACT_PHONE_VALIDATION}&phone=${encodeURIComponent(phoneNumber)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; SecurityAnalysis/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`Phone validation API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Phone validation successful:', data);

      let riskScore = data.fraud_score || 0;
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore > 70) riskLevel = 'critical';
      else if (riskScore > 40) riskLevel = 'high';
      else if (riskScore > 10) riskLevel = 'medium';

      let details = `Valid: ${data.valid ? 'Yes' : 'No'}, Type: ${data.type || 'Unknown'}`;
      if (data.carrier) details += `, Carrier: ${data.carrier}`;
      if (data.location) details += `, Location: ${data.location}`;
      if (data.country?.name) details += `, Country: ${data.country.name}`;

      return {
        phone: phoneNumber,
        isValid: data.valid,
        isMobile: data.type === 'mobile',
        carrier: data.carrier,
        country: data.country?.name,
        countryCode: data.country?.code,
        riskScore,
        riskLevel,
        details
      };
    } catch (error) {
      console.error('❌ Phone validation failed:', error);
      return {
        phone: phoneNumber,
        isValid: false,
        isMobile: false,
        riskScore: 50,
        riskLevel: 'medium',
        details: `⚠️ Couldn't validate phone number: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  generateVerificationCode(phoneNumber: string): string {
    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    this.verificationCodes.set(phoneNumber, {
      code,
      expiresAt,
      attempts: 0
    });

    console.log(`📱 Generated verification code for ${phoneNumber}: ${code}`);
    return code;
  }

  verifyCode(phoneNumber: string, inputCode: string): VerificationCodeResult {
    const stored = this.verificationCodes.get(phoneNumber);
    
    if (!stored) {
      return {
        success: false,
        message: 'No verification code found for this phone number. Please request a new one.'
      };
    }

    if (Date.now() > stored.expiresAt) {
      this.verificationCodes.delete(phoneNumber);
      return {
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      };
    }

    if (stored.attempts >= 3) {
      this.verificationCodes.delete(phoneNumber);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new verification code.'
      };
    }

    if (stored.code === inputCode) {
      this.verificationCodes.delete(phoneNumber);
      return {
        success: true,
        message: 'Phone number verified successfully!'
      };
    } else {
      stored.attempts++;
      this.verificationCodes.set(phoneNumber, stored);
      
      return {
        success: false,
        message: 'Invalid verification code. Please try again.',
        attemptsRemaining: 3 - stored.attempts
      };
    }
  }

  // Simulate sending SMS (in real app, integrate with SMS service like Twilio)
  async sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
    try {
      console.log(`📤 Sending SMS to ${phoneNumber} with code: ${code}`);
      
      // In a real application, you would integrate with an SMS service like:
      // - Twilio
      // - AWS SNS
      // - SendGrid
      // - Abstract SMS API
      
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ SMS sent successfully (simulated)');
      return true;
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      return false;
    }
  }

  // Extract phone number from Google OAuth profile
  extractPhoneFromGoogleProfile(profile: any): string | null {
    try {
      // Google OAuth doesn't typically provide phone numbers in the basic profile
      // This would need to be requested as an additional scope
      // For now, we'll check if it exists in the profile
      if (profile.phone_number) {
        return profile.phone_number;
      }
      
      // Check if phone is in the user metadata
      if (profile.user_metadata?.phone_number) {
        return profile.user_metadata.phone_number;
      }
      
      return null;
    } catch (error) {
      console.warn('Could not extract phone from Google profile:', error);
      return null;
    }
  }

  // Format phone number for display
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 11) {
      return `+${digits}`;
    }
    
    return phone; // Return original if can't format
  }

  // Clean up expired codes
  cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [phone, data] of this.verificationCodes.entries()) {
      if (now > data.expiresAt) {
        this.verificationCodes.delete(phone);
      }
    }
  }
}

export const mobileVerificationService = MobileVerificationService.getInstance();
