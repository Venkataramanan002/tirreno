import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, Shield, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { firebasePhoneAuth } from '@/services/firebasePhoneAuth';
import OTPInput from './OTPInput';

interface FirebasePhoneAuthProps {
  onSuccess: (user: any) => void;
  onBack: () => void;
}

const FirebasePhoneAuth: React.FC<FirebasePhoneAuthProps> = ({ onSuccess, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  // Initialize reCAPTCHA on component mount
  useEffect(() => {
    // reCAPTCHA will be initialized by the RecaptchaComponent
    // This component is now deprecated in favor of the integrated Auth page
    console.warn('FirebasePhoneAuth component is deprecated. Use the integrated Auth page instead.');
  }, []);

  // Format phone number input
  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const [, area, exchange, number] = match;
      if (number) {
        return `(${area}) ${exchange}-${number}`;
      } else if (exchange) {
        return `(${area}) ${exchange}`;
      } else if (area) {
        return `(${area}`;
      }
    }
    return cleaned;
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    if (!isRecaptchaReady) {
      setError('Verification system is not ready. Please wait a moment.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert formatted phone to international format
      const cleaned = phoneNumber.replace(/\D/g, '');
      const internationalPhone = cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;

      const result = await firebasePhoneAuth.sendOTP(internationalPhone);
      
      if (result.success) {
        setShowOTP(true);
        setError(null);
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otp: string) => {
    try {
      const result = await firebasePhoneAuth.verifyOTP(otp);
      
      if (result.success && result.user) {
        onSuccess(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Verification failed' };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      const cleaned = phoneNumber.replace(/\D/g, '');
      const internationalPhone = cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
      
      const result = await firebasePhoneAuth.sendOTP(internationalPhone);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to resend OTP' };
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Go back to phone input
  const handleBackToPhone = () => {
    setShowOTP(false);
    setError(null);
  };

  if (showOTP) {
    return (
      <div className="space-y-4">
        <OTPInput
          phoneNumber={phoneNumber}
          onVerify={handleVerifyOTP}
          onResend={handleResendOTP}
          onBack={handleBackToPhone}
          isLoading={isLoading}
        />
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container" className="hidden"></div>
      </div>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700 glow-cyan">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Phone Authentication
        </CardTitle>
        <CardDescription className="text-gray-400">
          Secure sign-in with your phone number using Firebase Authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Phone Number Input */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-200 flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan-400" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phoneNumber}
            onChange={handlePhoneChange}
            className="bg-gray-700/50 border-gray-600 text-white"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400">
            Enter your phone number. We'll send you a verification code.
          </p>
        </div>

        {/* Send OTP Button */}
        <Button
          onClick={handleSendOTP}
          disabled={!phoneNumber.trim() || isLoading || !isRecaptchaReady}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sending Code...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 mr-2" />
              Send Verification Code
            </>
          )}
        </Button>

        {/* Back Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isLoading}
            className="text-gray-400 hover:text-white"
          >
            ← Back to Email Sign In
          </Button>
        </div>

        {/* reCAPTCHA Status */}
        {!isRecaptchaReady && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Initializing verification system...</span>
          </div>
        )}

        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container" className="hidden"></div>
      </CardContent>
    </Card>
  );
};

export default FirebasePhoneAuth;
