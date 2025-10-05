import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, ChevronDown, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { phoneFormattingService, CountryInfo, FormattedPhoneNumber } from '@/services/phoneFormattingService';
import { PhoneValidationService, PhoneValidationResult } from '@/services/phoneValidationService';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation: (result: PhoneValidationResult | null) => void;
  onCountryChange: (country: CountryInfo | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onValidation,
  onCountryChange,
  disabled = false,
  placeholder = "Enter phone number"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedPhone, setFormattedPhone] = useState<FormattedPhoneNumber | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format phone number on input change
  useEffect(() => {
    const formatPhone = async () => {
      if (value.trim()) {
        const formatted = await phoneFormattingService.formatPhoneNumber(value);
        setFormattedPhone(formatted);
        
        if (formatted.country && formatted.country !== selectedCountry) {
          setSelectedCountry(formatted.country);
          onCountryChange(formatted.country);
        }
      } else {
        setFormattedPhone(null);
        setSelectedCountry(null);
        onCountryChange(null);
      }
    };

    formatPhone();
  }, [value, selectedCountry, onCountryChange]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Handle country selection
  const handleCountrySelect = (country: CountryInfo) => {
    setSelectedCountry(country);
    onCountryChange(country);
    setIsOpen(false);
    setSearchQuery('');
    
    // Focus back to input
    inputRef.current?.focus();
  };

  // Validate phone number
  const handleValidate = async () => {
    if (!value.trim()) return;

    setIsValidating(true);
    try {
      const result = await PhoneValidationService.validatePhone(value);
      setValidationResult(result);
      onValidation(result);
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResult(null);
      onValidation(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Filter countries based on search
  const filteredCountries = phoneFormattingService.searchCountries(searchQuery);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      {/* Phone Input with Country Selector */}
      <div className="flex gap-2">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex items-center gap-2 bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600 min-w-[120px]"
          >
            {selectedCountry ? (
              <>
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                <span className="text-sm">Country</span>
              </>
            )}
            <ChevronDown className="w-4 h-4" />
          </Button>

          {/* Country Dropdown */}
          {isOpen && (
            <Card className="absolute top-full left-0 mt-1 w-80 max-h-60 overflow-hidden bg-gray-800 border-gray-600 z-50">
              <CardContent className="p-2">
                {/* Search Input */}
                <Input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2 bg-gray-700 border-gray-600 text-white"
                />
                
                {/* Country List */}
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className="w-full flex items-center gap-3 p-2 text-left hover:bg-gray-700 rounded text-white"
                    >
                      <span className="text-lg">{country.flag}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{country.name}</div>
                        <div className="text-xs text-gray-400">{country.dialCode}</div>
                      </div>
                      {selectedCountry?.code === country.code && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Phone Number Input */}
        <Input
          ref={inputRef}
          type="tel"
          placeholder={selectedCountry ? selectedCountry.format : placeholder}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="flex-1 bg-gray-700/50 border-gray-600 text-white"
        />

        {/* Validate Button */}
        <Button
          type="button"
          onClick={handleValidate}
          disabled={isValidating || !value.trim() || disabled}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4"
        >
          {isValidating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Validate"}
        </Button>
      </div>

      {/* Country Info Display */}
      {selectedCountry && (
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-lg">{selectedCountry.flag}</span>
          <span>{selectedCountry.name}</span>
          <span className="text-gray-500">•</span>
          <span>{selectedCountry.dialCode}</span>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className={`p-3 rounded text-sm ${
          validationResult.isValid
            ? 'bg-green-900/20 text-green-400 border border-green-500/30'
            : 'bg-red-900/20 text-red-400 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {validationResult.isValid ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="font-medium">
              {validationResult.isValid ? 'Valid Phone Number' : 'Invalid Phone Number'}
            </span>
          </div>
          
          {validationResult.isValid && (
            <div className="space-y-1 text-xs">
              <div>Carrier: <span className="font-medium">{validationResult.carrier}</span></div>
              <div>Country: <span className="font-medium">{validationResult.country}</span></div>
              <div>Type: <span className="font-medium">{validationResult.lineType}</span></div>
              <div>Risk Level: <span className={`font-bold ${
                validationResult.riskLevel === 'critical' ? 'text-red-400' :
                validationResult.riskLevel === 'high' ? 'text-orange-400' :
                validationResult.riskLevel === 'medium' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {validationResult.riskLevel.toUpperCase()}
              </span></div>
            </div>
          )}
          
          {validationResult.recommendations.length > 0 && (
            <div className="mt-2 text-xs">
              <div className="font-medium mb-1">Recommendations:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationResult.recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Formatted Phone Display */}
      {formattedPhone && formattedPhone.formatted !== value && (
        <div className="text-xs text-gray-400">
          Formatted: {formattedPhone.formatted}
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
