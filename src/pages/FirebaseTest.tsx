import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { auth } from '@/config/firebase';

const FirebaseTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, isError = false) => {
    setTestResults(prev => [...prev, `${isError ? '❌' : '✅'} ${message}`]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Firebase Auth Instance
      addResult('Testing Firebase Auth instance...');
      if (auth) {
        addResult('Firebase Auth instance created successfully');
      } else {
        addResult('Firebase Auth instance failed', true);
        return;
      }

      // Test 2: Firebase Config
      addResult('Testing Firebase configuration...');
      const config = auth.app.options;
      if (config.apiKey && config.authDomain && config.projectId) {
        addResult(`Project ID: ${config.projectId}`);
        addResult(`Auth Domain: ${config.authDomain}`);
        addResult('Firebase configuration is valid');
      } else {
        addResult('Firebase configuration is incomplete', true);
        return;
      }

      // Test 3: Check if emulators are connected
      addResult('Checking Firebase emulator connection...');
      if (auth.emulatorConfig) {
        addResult('⚠️ Firebase emulators are connected - this may cause OTP issues', true);
        addResult('Emulator URL: ' + auth.emulatorConfig.url);
      } else {
        addResult('✅ No emulators connected - using production Firebase');
      }

      // Test 4: Check reCAPTCHA availability
      addResult('Testing reCAPTCHA availability...');
      if (typeof window !== 'undefined' && window.grecaptcha) {
        addResult('reCAPTCHA is available');
      } else {
        addResult('reCAPTCHA not loaded - this will cause OTP issues', true);
      }

      // Test 5: Environment variables
      addResult('Testing environment variables...');
      const envVars = {
        VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      };

      Object.entries(envVars).forEach(([key, value]) => {
        if (value) {
          addResult(`${key}: Set`);
        } else {
          addResult(`${key}: Not set`, true);
        }
      });

      addResult('Firebase test completed!');

    } catch (error: any) {
      addResult(`Test failed: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Firebase Configuration Test
          </CardTitle>
          <CardDescription className="text-gray-400">
            This page helps debug Firebase phone authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={runTests}
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Run Firebase Tests
              </>
            )}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-medium">Test Results:</h3>
              <div className="bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm text-gray-300 mb-1">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Common Issues:</strong><br/>
              1. Firebase emulators connected (disable them for phone auth)<br/>
              2. reCAPTCHA not loaded (check network connection)<br/>
              3. Phone authentication not enabled in Firebase Console<br/>
              4. Invalid phone number format (must start with +)
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Button
              onClick={() => window.location.href = '/auth'}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back to Auth Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebaseTestPage;
