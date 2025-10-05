import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/config/firebase';

interface RecaptchaComponentProps {
  onRecaptchaReady: (verifier: RecaptchaVerifier) => void;
  onError: (error: string) => void;
}

const RecaptchaComponent: React.FC<RecaptchaComponentProps> = ({
  onRecaptchaReady,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    initializeRecaptcha();
    
    return () => {
      // Cleanup
      if (verifierRef.current) {
        verifierRef.current.clear();
      }
    };
  }, []);

  const initializeRecaptcha = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!recaptchaRef.current) {
        throw new Error('reCAPTCHA container not found');
      }

      // Clear any existing verifier
      if (verifierRef.current) {
        verifierRef.current.clear();
      }

      // Create visible reCAPTCHA verifier
      const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'normal', // Changed from 'invisible' to 'normal'
        callback: () => {
          console.log('✅ reCAPTCHA solved successfully');
          setIsReady(true);
          onRecaptchaReady(verifier);
        },
        'expired-callback': () => {
          console.log('❌ reCAPTCHA expired');
          setIsReady(false);
          setError('reCAPTCHA expired. Please solve it again.');
        },
        'error-callback': (error: any) => {
          console.error('❌ reCAPTCHA error:', error);
          setIsReady(false);
          setError('reCAPTCHA error. Please try again.');
        }
      });

      verifierRef.current = verifier;

      // Render reCAPTCHA
      await verifier.render();
      console.log('✅ reCAPTCHA rendered successfully');
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('❌ reCAPTCHA initialization failed:', error);
      setError(`Failed to initialize reCAPTCHA: ${error.message}`);
      setIsLoading(false);
      onError(error.message);
    }
  };

  const handleRetry = () => {
    initializeRecaptcha();
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Security Verification
        </CardTitle>
        <CardDescription className="text-gray-400">
          Complete the reCAPTCHA to verify you're not a robot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
              <p className="text-gray-400">Initializing security verification...</p>
            </div>
          </div>
        )}

        {/* reCAPTCHA Container */}
        <div 
          ref={recaptchaRef} 
          className="flex justify-center"
          style={{ minHeight: '78px' }} // Standard reCAPTCHA height
        />

        {isReady && (
          <div className="flex items-center gap-2 p-3 bg-green-900/20 text-green-400 border border-green-500/30 rounded">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Security verification complete!</span>
          </div>
        )}

        {error && (
          <Button
            onClick={handleRetry}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Verification
          </Button>
        )}

        <div className="text-xs text-gray-500 text-center">
          This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
        </div>
      </CardContent>
    </Card>
  );
};

export default RecaptchaComponent;
