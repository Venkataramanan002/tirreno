import { supabase } from '../integrations/supabase/client';

export interface ErrorLog {
  id?: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  source: string;
  action?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorQueue: ErrorLog[] = [];
  private isProcessingQueue = false;

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  // Log error with context
  logError(
    error: Error | string,
    context: Record<string, any> = {},
    level: ErrorLog['level'] = 'error',
    source: string = 'unknown',
    action?: string
  ): void {
    const errorLog: ErrorLog = {
      level,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      timestamp: new Date(),
      source,
      action,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId()
    };

    console.error(`[${level.toUpperCase()}] ${source}:`, errorLog);

    // Add to queue for batch processing
    this.errorQueue.push(errorLog);
    this.processErrorQueue();
  }

  // Log Firebase phone auth specific errors
  logFirebaseAuthError(
    error: any,
    action: string,
    context: Record<string, any> = {}
  ): void {
    this.logError(
      error,
      {
        ...context,
        firebaseErrorCode: error.code,
        firebaseErrorMessage: error.message,
        action
      },
      'error',
      'firebase-phone-auth',
      action
    );
  }

  // Log verification attempts
  logVerificationAttempt(
    phoneNumber: string,
    action: 'sms_sent' | 'otp_verified' | 'otp_failed' | 'resend_requested',
    success: boolean,
    error?: string
  ): void {
    const logData = {
      phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // Mask phone number
      action,
      success,
      error,
      timestamp: new Date().toISOString()
    };

    console.log(`[VERIFICATION] ${action}:`, logData);

    // Store in Supabase for audit trail
    this.storeVerificationLog(phoneNumber, action, success, error);
  }

  // Store verification log in Supabase
  private async storeVerificationLog(
    phoneNumber: string,
    action: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const { error: dbError } = await supabase
        .from('firebase_verification_logs')
        .insert({
          phone_number: phoneNumber,
          verification_type: action,
          status: success ? 'success' : 'failed',
          error_message: error,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          metadata: {
            timestamp: new Date().toISOString(),
            success
          }
        });

      if (dbError) {
        console.error('Failed to store verification log:', dbError);
      }
    } catch (error) {
      console.error('Error storing verification log:', error);
    }
  }

  // Retry function with exponential backoff
  async retry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxAttempts) {
          this.logError(
            lastError,
            { attempt, maxAttempts: config.maxAttempts },
            'error',
            'retry-service',
            'max_attempts_reached'
          );
          throw lastError;
        }

        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        this.logError(
          lastError,
          { attempt, delay, maxAttempts: config.maxAttempts },
          'warning',
          'retry-service',
          'retry_attempt'
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  // Process error queue in batches
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const batch = this.errorQueue.splice(0, 10); // Process 10 at a time
      
      // Store critical errors in Supabase
      const criticalErrors = batch.filter(log => log.level === 'error');
      
      if (criticalErrors.length > 0) {
        await this.storeErrorsInSupabase(criticalErrors);
      }

      // Clear processed errors
      this.errorQueue = this.errorQueue.filter(log => !batch.includes(log));
    } catch (error) {
      console.error('Failed to process error queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Store errors in Supabase
  private async storeErrorsInSupabase(errors: ErrorLog[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert(errors.map(log => ({
          level: log.level,
          message: log.message,
          stack: log.stack,
          context: log.context,
          user_id: log.userId,
          session_id: log.sessionId,
          source: log.source,
          action: log.action,
          created_at: log.timestamp.toISOString()
        })));

      if (error) {
        console.error('Failed to store errors in Supabase:', error);
      }
    } catch (error) {
      console.error('Error storing errors in Supabase:', error);
    }
  }

  // Get current user ID
  private getCurrentUserId(): string | undefined {
    try {
      const firebaseUser = localStorage.getItem('firebase_user');
      if (firebaseUser) {
        return JSON.parse(firebaseUser).uid;
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return undefined;
  }

  // Get current session ID
  private getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  // Get client IP (simplified)
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear error queue
  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  // Get error statistics
  getErrorStats(): { total: number; byLevel: Record<string, number> } {
    const stats = {
      total: this.errorQueue.length,
      byLevel: {} as Record<string, number>
    };

    this.errorQueue.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    return stats;
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();
