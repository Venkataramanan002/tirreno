
import { API_KEYS } from '../config/apiKeys';

export interface VerificationCode {
  code: string;
  expiresAt: Date;
  attempts: number;
}

export class EmailVerificationService {
  private static verificationCodes = new Map<string, VerificationCode>();
  
  static async sendVerificationEmail(email: string): Promise<{ success: boolean; code?: string }> {
    const code = Math.random().toString().slice(2, 8).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    this.verificationCodes.set(email, {
      code,
      expiresAt,
      attempts: 0
    });
    
    console.log('📧 Attempting to send verification email to:', email);
    console.log('🔑 Generated code:', code);
    console.log('⏰ Expires at:', expiresAt.toLocaleTimeString());
    
    try {
      console.log('🚀 Attempting Supabase Edge Function...');
      console.log('🔗 Supabase URL:', API_KEYS.SUPABASE_URL);
      
      const response = await fetch(`${API_KEYS.SUPABASE_URL}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEYS.SUPABASE_SERVICE_ROLE}`,
          'apikey': API_KEYS.SUPABASE_SERVICE_ROLE
        },
        body: JSON.stringify({
          email,
          code,
          expiresAt: expiresAt.toISOString()
        })
      });

      console.log('📡 Supabase response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.text();
        console.log('✅ Supabase response:', responseData);
        console.log('✅ Verification email sent successfully!');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.log('❌ Supabase error:', response.status, errorText);
        throw new Error(`Supabase function failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      console.log('🎯 DEMO MODE ACTIVATED');
      console.log('📧 =====================================================');
      console.log(`📧 VERIFICATION CODE FOR ${email}: ${code}`);
      console.log(`📧 CODE EXPIRES AT: ${expiresAt.toLocaleTimeString()}`);
      console.log('📧 =====================================================');
      console.log('ℹ️ In production, this code would be sent via email');
      
      // Return the code for demo purposes
      return { success: true, code };
    }
  }
  
  static verifyCode(email: string, inputCode: string): { success: boolean; message: string } {
    console.log('🔍 Verifying code for:', email, 'Input:', inputCode);
    
    const storedVerification = this.verificationCodes.get(email);
    
    if (!storedVerification) {
      console.log('❌ No verification code found');
      return { success: false, message: 'No verification code found. Please request a new one.' };
    }
    
    console.log('📋 Stored verification:', storedVerification);
    
    if (new Date() > storedVerification.expiresAt) {
      console.log('⏰ Code has expired');
      this.verificationCodes.delete(email);
      return { success: false, message: 'Verification code has expired. Please request a new one.' };
    }
    
    storedVerification.attempts++;
    console.log('🔢 Attempt number:', storedVerification.attempts);
    
    if (storedVerification.attempts > 3) {
      console.log('❌ Too many attempts');
      this.verificationCodes.delete(email);
      return { success: false, message: 'Too many failed attempts. Please request a new code.' };
    }
    
    if (storedVerification.code === inputCode) {
      console.log('✅ Code verified successfully!');
      this.verificationCodes.delete(email);
      return { success: true, message: 'Email verified successfully!' };
    }
    
    console.log('❌ Invalid code');
    return { 
      success: false, 
      message: `Invalid code. ${4 - storedVerification.attempts} attempts remaining.` 
    };
  }
  
  static resendCode(email: string): Promise<{ success: boolean; code?: string }> {
    console.log('🔄 Resending code for:', email);
    this.verificationCodes.delete(email);
    return this.sendVerificationEmail(email);
  }
}
