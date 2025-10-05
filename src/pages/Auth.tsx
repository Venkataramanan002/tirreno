import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle, Phone, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchGoogleProfile, fetchGmailMetadata, fetchGmailMessages } from "@/services/googleService";
import { PhoneValidationService, PhoneValidationResult } from "@/services/phoneValidationService";
import { firebasePhoneAuth } from "@/services/firebasePhoneAuth";
import OTPInput from "@/components/OTPInput";
import PhoneInput from "@/components/PhoneInput";
import RecaptchaComponent from "@/components/RecaptchaComponent";
import { CountryInfo, phoneFormattingService } from "@/services/phoneFormattingService";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult | null>(null);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      const redirectTo = window.location.origin.includes('localhost')
        ? 'http://localhost:8080'
        : 'https://bpylpdcnhbtnhkspcqyy.supabase.co/auth/v1/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.metadata'
          ].join(' '),
          redirectTo
        }
      });
      if (error) throw error;
      return data;
    } catch (e: any) {
      setError(e?.message || 'Google login failed');
    } finally {
      setOauthLoading(false);
    }
  };


  // Handle reCAPTCHA ready
  const handleRecaptchaReady = (verifier: any) => {
    firebasePhoneAuth.setRecaptchaVerifier(verifier);
    setRecaptchaError(null);
  };

  // Handle reCAPTCHA error
  const handleRecaptchaError = (error: string) => {
    setRecaptchaError(error);
  };

  // Handle phone validation from PhoneInput component
  const handlePhoneValidation = (result: PhoneValidationResult | null) => {
    setPhoneValidation(result);
    if (result && !result.isValid) {
      setError(`Invalid phone number: ${result.recommendations[0] || 'Please check the number format'}`);
    } else {
      setError(null);
    }
  };

  // Handle country selection
  const handleCountryChange = (country: CountryInfo | null) => {
    setSelectedCountry(country);
  };

  // Send Firebase OTP
  const handleSendFirebaseOTP = async () => {
    if (!phoneValidation?.isValid) {
      setError('Please validate your phone number first');
      return;
    }

    // Check if reCAPTCHA is ready
    if (!firebasePhoneAuth.isRecaptchaReady()) {
      setShowRecaptcha(true);
      return;
    }

    setIsSendingOTP(true);
    setError(null);

    try {
      // Ensure phone number has proper format for Firebase
      let formattedPhone = phoneNumber;
      
      // If phone number doesn't start with +, add country code
      if (!formattedPhone.startsWith('+')) {
        if (selectedCountry) {
          formattedPhone = `${selectedCountry.dialCode}${formattedPhone}`;
        } else {
          // Try to detect from validation result
          const countryCode = phoneValidation.countryCode || 'US';
          const country = phoneFormattingService.getCountryByCode(countryCode);
          if (country) {
            formattedPhone = `${country.dialCode}${formattedPhone}`;
          } else {
            formattedPhone = `+1${formattedPhone}`; // Default to US
          }
        }
      }

      console.log('📱 Sending OTP to formatted number:', formattedPhone);
      
      const result = await firebasePhoneAuth.sendOTP(formattedPhone);
      
      if (result.success) {
        setShowOTPInput(true);
        setError(null);
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Verify Firebase OTP
  const handleVerifyFirebaseOTP = async (otp: string) => {
    try {
      const result = await firebasePhoneAuth.verifyOTP(otp);
      
      if (result.success && result.user) {
        setVerificationSuccess(true);
        setError(null);
        
        // Store phone validation data for later use
        localStorage.setItem('phoneValidationData', JSON.stringify(phoneValidation));
        localStorage.setItem('firebaseUser', JSON.stringify({
          uid: result.user.uid,
          phoneNumber: result.user.phoneNumber,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        }));
        
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Verification failed' };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Resend Firebase OTP
  const handleResendFirebaseOTP = async () => {
    try {
      const result = await firebasePhoneAuth.sendOTP(phoneNumber);
      
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
    setShowOTPInput(false);
    setError(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setError("Please confirm your email first. Check your inbox for the confirmation link.");
          } else if (error.message.includes("Invalid login credentials")) {
            setError("Invalid email or password. If you just signed up, please confirm your email first.");
          } else {
            setError(error.message);
          }
          throw error;
        }
        // Navigate to the main dashboard on successful login
        navigate("/");
      } else {
        // For signup, ensure phone is verified
        if (!verificationSuccess) {
          setError("Please verify your mobile number before signing up.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              phone_number: phoneNumber, // Store verified phone number in user metadata
              phone_validation_data: phoneValidation, // Store Abstract API validation data
              firebase_uid: localStorage.getItem('firebaseUser') ? JSON.parse(localStorage.getItem('firebaseUser')!).uid : null,
            }
          },
        });
        
        if (error) {
          // Handle rate limiting errors
          if (error.message.includes("429") || error.message.includes("rate limit")) {
            setError("Too many signup attempts. Please wait a minute before trying again.");
          } else {
            setError(error.message);
          }
          throw error;
        }
        
        // Only show success message if no error
        if (data.user) {
          setError("Success! Check your email to confirm your account before logging in.");
        }
      }
    } catch (err: any) {
      // Error already handled above
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Show reCAPTCHA if needed
  if (showRecaptcha) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <RecaptchaComponent
            onRecaptchaReady={handleRecaptchaReady}
            onError={handleRecaptchaError}
          />
          <div className="mt-4 text-center">
            <Button
              onClick={() => setShowRecaptcha(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back to Phone Input
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show OTP input if phone verification is in progress
  if (showOTPInput) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <OTPInput
            phoneNumber={phoneNumber}
            onVerify={handleVerifyFirebaseOTP}
            onResend={handleResendFirebaseOTP}
            onBack={handleBackToPhone}
            isLoading={isSendingOTP}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-700 glow-cyan">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg glow-cyan-strong">
              <Shield className="w-10 h-10 text-black" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isLogin ? "Sign in to access your security dashboard" : "Sign up to get started with mobile verification"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <Alert variant={error.includes("Success!") || error.includes("Check your email") ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>

            {/* Mobile Number Verification */}
            <div className="space-y-2">
              <Label className="text-gray-200 flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-400" />
                Mobile Number
              </Label>
              
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                onValidation={handlePhoneValidation}
                onCountryChange={handleCountryChange}
                disabled={verificationSuccess}
                placeholder="Enter your phone number"
              />

              {/* Send Firebase OTP Button */}
              {phoneValidation?.isValid && !verificationSuccess && (
                <Button
                  type="button"
                  onClick={handleSendFirebaseOTP}
                  disabled={isSendingOTP}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {isSendingOTP ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              )}

              {/* reCAPTCHA Error */}
              {recaptchaError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{recaptchaError}</AlertDescription>
                </Alert>
              )}

              {/* Verification Success Indicator */}
              {verificationSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 text-green-400 border border-green-500/30 rounded">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Phone number verified successfully!</span>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-cyan-600 hover:bg-cyan-700 glow-cyan"
              disabled={loading || (!isLogin && !verificationSuccess)}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 glow-cyan"
              disabled={oauthLoading}
            >
              {oauthLoading ? 'Connecting Google...' : 'Continue with Google'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setPhoneNumber("");
                  setVerificationCode("");
                  setMobileVerification(null);
                  setShowVerificationCode(false);
                  setCodeSent(false);
                  setVerificationSuccess(false);
                }}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
