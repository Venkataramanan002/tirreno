import { PhoneValidationService, PhoneValidationResult } from './phoneValidationService';

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: string;
}

export interface FormattedPhoneNumber {
  original: string;
  formatted: string;
  international: string;
  country: CountryInfo | null;
  isValid: boolean;
}

class PhoneFormattingService {
  private static instance: PhoneFormattingService;
  private countries: CountryInfo[] = [];

  static getInstance(): PhoneFormattingService {
    if (!PhoneFormattingService.instance) {
      PhoneFormattingService.instance = new PhoneFormattingService();
    }
    return PhoneFormattingService.instance;
  }

  constructor() {
    this.initializeCountries();
  }

  private initializeCountries() {
    this.countries = [
      { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', format: '(XXX) XXX-XXXX' },
      { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: '(XXX) XXX-XXXX' },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', format: 'XXXX XXX XXX' },
      { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', format: 'XXX XXXXXXX' },
      { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: 'X XX XX XX XX' },
      { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', format: 'XXX XXX XXXX' },
      { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', format: 'XXX XXX XXX' },
      { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', format: 'XXX XXX XXX' },
      { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', format: 'XX-XXXX-XXXX' },
      { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', format: 'XXX XXXX XXXX' },
      { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', format: 'XXXXX XXXXX' },
      { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', format: '(XX) XXXXX-XXXX' },
      { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', format: 'XXX XXX XXXX' },
      { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', format: 'XXX XXX-XX-XX' },
      { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', format: 'XXX-XXXX-XXXX' },
      { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', format: 'XXXX XXXX' },
      { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852', format: 'XXXX XXXX' },
      { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886', format: 'XXX XXX XXX' },
      { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66', format: 'XXX XXX XXX' },
      { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60', format: 'XXX XXX XXX' },
      { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', format: 'XXX-XXXX-XXXX' },
      { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', format: 'XXX XXX XXXX' },
      { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', format: 'XXX XXX XXXX' },
      { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', format: 'XXX XXX XXXX' },
      { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971', format: 'XXX XXX XXX' },
      { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', format: 'XXX XXX XXXX' },
      { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', format: 'XXX XXX XXXX' },
      { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', format: 'XXX XXX XXXX' },
      { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', format: 'XXX XXX XXX' },
      { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', format: 'XXX XXX-XXXX' },
      { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', format: 'X XXXX XXXX' },
      { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', format: 'XXX XXX XXXX' },
      { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51', format: 'XXX XXX XXX' },
      { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58', format: 'XXX-XXX-XXXX' },
      { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', format: 'XXX XXX XX XX' },
      { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972', format: 'XXX-XXX-XXXX' },
      { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48', format: 'XXX XXX XXX' },
      { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', format: 'X XXXX XXXX' },
      { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32', format: 'XXX XX XX XX' },
      { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41', format: 'XX XXX XX XX' },
      { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', format: 'XXX XXXXXXX' },
      { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46', format: 'XXX XXX XXX' },
      { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47', format: 'XXX XX XXX' },
      { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45', format: 'XX XX XX XX' },
      { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358', format: 'XXX XXX XXX' },
      { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353', format: 'XXX XXX XXX' },
      { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', format: 'XXX XXX XXX' },
      { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30', format: 'XXX XXX XXXX' },
      { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420', format: 'XXX XXX XXX' },
      { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36', format: 'XXX XXX XXX' },
      { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40', format: 'XXX XXX XXX' },
      { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359', format: 'XXX XXX XXX' },
      { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385', format: 'XXX XXX XXX' },
      { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421', format: 'XXX XXX XXX' },
      { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386', format: 'XXX XXX XXX' },
      { code: 'LT', name: 'Lithuania', flag: '🇱🇹', dialCode: '+370', format: 'XXX XXX XXX' },
      { code: 'LV', name: 'Latvia', flag: '🇱🇻', dialCode: '+371', format: 'XXX XXX XXX' },
      { code: 'EE', name: 'Estonia', flag: '🇪🇪', dialCode: '+372', format: 'XXX XXX XXX' },
    ];
  }

  // Format phone number with country detection
  async formatPhoneNumber(input: string): Promise<FormattedPhoneNumber> {
    try {
      // Clean the input
      const cleaned = input.replace(/\D/g, '');
      
      if (!cleaned) {
        return {
          original: input,
          formatted: '',
          international: '',
          country: null,
          isValid: false
        };
      }

      // Try to detect country from input
      let detectedCountry: CountryInfo | null = null;
      let phoneDigits = cleaned;

      // Check if input starts with country code
      for (const country of this.countries) {
        const dialCodeDigits = country.dialCode.replace('+', '');
        if (cleaned.startsWith(dialCodeDigits)) {
          detectedCountry = country;
          phoneDigits = cleaned.substring(dialCodeDigits.length);
          break;
        }
      }

      // If no country detected, try to guess from length and patterns
      if (!detectedCountry) {
        if (cleaned.length === 10) {
          // Likely US/Canada number
          detectedCountry = this.countries.find(c => c.code === 'US') || null;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
          // US/Canada with country code
          detectedCountry = this.countries.find(c => c.code === 'US') || null;
          phoneDigits = cleaned.substring(1);
        }
      }

      // Format the phone number
      let formatted = phoneDigits;
      if (detectedCountry) {
        formatted = this.applyFormat(phoneDigits, detectedCountry.format);
      }

      // Create international format
      const international = detectedCountry 
        ? `${detectedCountry.dialCode}${phoneDigits}`
        : `+${cleaned}`;

      // Validate with Abstract API for additional info
      let validationResult: PhoneValidationResult | null = null;
      try {
        validationResult = await PhoneValidationService.validatePhone(international);
      } catch (error) {
        console.warn('Phone validation failed:', error);
      }

      // Use validation result to update country info if available
      if (validationResult && validationResult.isValid) {
        const validatedCountry = this.countries.find(c => 
          c.name.toLowerCase() === validationResult!.country?.toLowerCase()
        );
        if (validatedCountry) {
          detectedCountry = validatedCountry;
        }
      }

      return {
        original: input,
        formatted: detectedCountry ? formatted : cleaned,
        international,
        country: detectedCountry,
        isValid: validationResult?.isValid || false
      };

    } catch (error) {
      console.error('Phone formatting error:', error);
      return {
        original: input,
        formatted: input,
        international: input,
        country: null,
        isValid: false
      };
    }
  }

  // Apply formatting pattern to phone digits
  private applyFormat(digits: string, pattern: string): string {
    let formatted = '';
    let digitIndex = 0;

    for (let i = 0; i < pattern.length && digitIndex < digits.length; i++) {
      if (pattern[i] === 'X') {
        formatted += digits[digitIndex];
        digitIndex++;
      } else {
        formatted += pattern[i];
      }
    }

    return formatted;
  }

  // Get country by code
  getCountryByCode(code: string): CountryInfo | null {
    return this.countries.find(c => c.code === code) || null;
  }

  // Get all countries
  getAllCountries(): CountryInfo[] {
    return [...this.countries];
  }

  // Search countries
  searchCountries(query: string): CountryInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.countries.filter(country => 
      country.name.toLowerCase().includes(lowerQuery) ||
      country.code.toLowerCase().includes(lowerQuery) ||
      country.dialCode.includes(query)
    );
  }
}

export const phoneFormattingService = PhoneFormattingService.getInstance();
