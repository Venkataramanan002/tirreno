import { 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signInWithCredential,
  RecaptchaVerifier,
  ConfirmationResult,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { supabase } from '../integrations/supabase/client';
import { errorHandlingService } from './errorHandlingService';

export interface PhoneAuthResult {
  success: boolean;
  user?: User;
  error?: string;
  verificationId?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  createdAt: Date;
  lastSignIn: Date;
  isVerified: boolean;
  riskScore?: number;
  threatLevel?: string;
}

class FirebasePhoneAuthService {
  private static instance: FirebasePhoneAuthService;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  static getInstance(): FirebasePhoneAuthService {
    if (!FirebasePhoneAuthService.instance) {
      FirebasePhoneAuthService.instance = new FirebasePhoneAuthService();
    }
    return FirebasePhoneAuthService.instance;
  }

  // Set reCAPTCHA verifier (called from RecaptchaComponent)
  setRecaptchaVerifier(verifier: RecaptchaVerifier): void {
    this.recaptchaVerifier = verifier;
    console.log('✅ reCAPTCHA verifier set');
  }

  // Check if reCAPTCHA is ready
  isRecaptchaReady(): boolean {
    return !!this.recaptchaVerifier;
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    try {
      console.log('📱 Sending OTP to:', phoneNumber);

      // Check if reCAPTCHA is ready
      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized. Please complete the security verification first.');
      }

      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      console.log('📱 Formatted phone number:', formattedPhone);

      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, this.recaptchaVerifier);
      
      this.confirmationResult = confirmationResult;

      // Log successful OTP send
      errorHandlingService.logVerificationAttempt(phoneNumber, 'sms_sent', true);
      console.log('✅ OTP sent successfully');

      return {
        success: true,
        verificationId: confirmationResult.verificationId
      };
    } catch (error: any) {
      console.error('❌ OTP send failed:', error);
      
      // Log failed OTP send
      errorHandlingService.logFirebaseAuthError(error, 'send_otp', { phoneNumber });
      errorHandlingService.logVerificationAttempt(phoneNumber, 'sms_sent', false, error.message);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please complete the security verification again.';
      } else if (error.message.includes('reCAPTCHA not initialized')) {
        errorMessage = 'Please complete the security verification first.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Verify OTP code
  async verifyOTP(otpCode: string): Promise<OTPVerificationResult> {
    try {
      console.log('🔐 Verifying OTP code');

      if (!this.confirmationResult) {
        throw new Error('No confirmation result available. Please request OTP again.');
      }

      // Verify the OTP with retry logic
      const result = await errorHandlingService.retry(
        () => this.confirmationResult!.confirm(otpCode),
        { maxAttempts: 1, baseDelay: 1000, maxDelay: 2000, backoffMultiplier: 1 }
      );
      
      const user = result.user;

      // Log successful verification
      errorHandlingService.logVerificationAttempt(user.phoneNumber || 'unknown', 'otp_verified', true);
      console.log('✅ OTP verified successfully for user:', user.uid);

      // Persist user data to backend
      await this.persistUserToBackend(user);

      return {
        success: true,
        user
      };
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error);
      
      // Log failed verification
      errorHandlingService.logFirebaseAuthError(error, 'verify_otp', { otpCode: otpCode.substring(0, 2) + '****' });
      errorHandlingService.logVerificationAttempt('unknown', 'otp_failed', false, error.message);
      
      let errorMessage = 'Invalid OTP code. Please try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired. Please request a new one.';
      } else if (error.code === 'auth/invalid-verification-id') {
        errorMessage = 'Invalid verification session. Please start over.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Persist verified user data to Supabase
  private async persistUserToBackend(user: User): Promise<void> {
    try {
      console.log('💾 Persisting user data to backend:', user.uid);

      // Create user profile
      const userProfile: UserProfile = {
        uid: user.uid,
        phoneNumber: user.phoneNumber || '',
        displayName: user.displayName || null,
        email: user.email || null,
        photoURL: user.photoURL || null,
        createdAt: new Date(),
        lastSignIn: new Date(),
        isVerified: true,
        riskScore: 0, // Will be calculated later
        threatLevel: 'unknown'
      };

      // Store in Supabase
      const { error: supabaseError } = await supabase
        .from('firebase_users')
        .upsert({
          firebase_uid: user.uid,
          phone_number: user.phoneNumber,
          display_name: user.displayName,
          email: user.email,
          photo_url: user.photoURL,
          is_verified: true,
          last_sign_in: new Date().toISOString(),
          created_at: new Date().toISOString()
        }, { 
          onConflict: 'firebase_uid' 
        });

      if (supabaseError) {
        console.error('❌ Supabase upsert failed:', supabaseError);
        throw supabaseError;
      }

      // Store in Firestore for additional data
      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastSignIn: serverTimestamp()
      });

      console.log('✅ User data persisted successfully');
    } catch (error) {
      console.error('❌ Failed to persist user data:', error);
      throw error;
    }
  }

  // Get user profile from backend
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      return null;
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await auth.signOut();
      this.confirmationResult = null;
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  // Clean up resources
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }
}

export const firebasePhoneAuth = FirebasePhoneAuthService.getInstance();
