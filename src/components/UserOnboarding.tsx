import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Mail, CheckCircle, AlertTriangle, Search, Activity, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadSQL, UserFormData } from "@/utils/sqlExporter";
import { setCurrentUser } from "@/services/mockApiService";
import { ThreatAnalysisService } from "@/services/threatAnalysisService";
import { EmailVerificationService } from "@/services/emailVerificationService";

interface UserOnboardingProps {
  onUserVerified: () => void;
}

const UserOnboarding = ({ onUserVerified }: UserOnboardingProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    securityConcerns: "",
    verificationCode: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState("");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [threatAnalysisResult, setThreatAnalysisResult] = useState<any>(null);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendVerificationEmail = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await EmailVerificationService.sendVerificationEmail(formData.email);
      
      if (result.success) {
        setGeneratedCode(result.code || "");
        
        toast({
          title: "Verification Email Sent",
          description: `A verification code has been sent to ${formData.email}. For demo: ${result.code}`,
        });
        
        setStep(2);
      } else {
        throw new Error("Failed to send verification email");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailAndAnalyze = async () => {
    setIsLoading(true);
    
    try {
      // Verify the code
      const verificationResult = EmailVerificationService.verifyCode(
        formData.email, 
        formData.verificationCode
      );
      
      if (!verificationResult.success) {
        toast({
          title: "Verification Failed",
          description: verificationResult.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Start threat analysis
      setStep(3);
      setAnalysisProgress(0);
      setCurrentAnalysisStep("Initializing security scan...");
      
      const analysisResult = await ThreatAnalysisService.performEmailAnalysis(
        formData.email,
        (step, progress) => {
          setCurrentAnalysisStep(step);
          setAnalysisProgress(progress);
        }
      );
      
      setThreatAnalysisResult(analysisResult);
      setAnalysisComplete(true);
      
      // Set up personalized data
      setCurrentUser(formData.email);
      
      // Generate SQL export
      const userFormData: UserFormData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`
      };
      
      downloadSQL(userFormData, {
        submissionTime: new Date().toISOString(),
        platform: 'Security Analysis Platform',
        analysisId: `ANALYSIS_${Date.now()}`,
        riskScore: analysisResult.overallRiskScore
      });
      
      toast({
        title: "Security Analysis Complete!",
        description: `Risk score: ${analysisResult.overallRiskScore}/100. Report downloaded.`,
      });
      
      setTimeout(() => {
        onUserVerified();
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to complete security analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setIsLoading(true);
    try {
      const result = await EmailVerificationService.resendCode(formData.email);
      if (result.success) {
        setGeneratedCode(result.code || "");
        toast({
          title: "New Code Sent",
          description: `A new verification code has been sent. Code: ${result.code}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const { firstName, lastName, email, phone } = formData;
    
    if (!firstName.trim() || !lastName.trim()) {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    if (!phone.trim() || phone.length < 10) {
      return false;
    }
    
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-white">Security Analysis Platform</CardTitle>
            <CardDescription className="text-slate-400">
              {step === 1 && "Enter your information for comprehensive security analysis"}
              {step === 2 && "Verify your email to begin threat analysis"}
              {step === 3 && !analysisComplete && "Performing deep security analysis..."}
              {step === 3 && analysisComplete && "Analysis complete! Preparing your dashboard..."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-1">Real Security Analysis</h4>
                    <p className="text-slate-300 text-sm">
                      Our platform performs comprehensive threat detection including email reputation checks, 
                      breach database lookups, tracker detection, and behavioral pattern analysis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="john.doe@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-300">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-slate-300">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="Security Analyst"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityConcerns" className="text-slate-300">
                  Security Concerns or Analysis Requirements
                </Label>
                <Textarea
                  id="securityConcerns"
                  value={formData.securityConcerns}
                  onChange={(e) => handleInputChange("securityConcerns", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Describe any specific security concerns..."
                  rows={3}
                />
              </div>

              <Button
                onClick={sendVerificationEmail}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Verification Email...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Send Verification Code</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-slate-300">
                Verification code sent to <span className="text-cyan-400">{formData.email}</span>
              </p>
              <p className="text-sm text-slate-400">
                Demo code: <span className="text-green-400 font-mono font-bold">{generatedCode}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-slate-300">Enter 6-Digit Code</Label>
                <Input
                  id="verificationCode"
                  value={formData.verificationCode}
                  onChange={(e) => handleInputChange("verificationCode", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={verifyEmailAndAnalyze}
                  disabled={formData.verificationCode.length !== 6 || isLoading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Begin Security Analysis"
                  )}
                </Button>
                <Button
                  onClick={resendCode}
                  variant="outline"
                  disabled={isLoading}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Resend
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              {!analysisComplete && (
                <>
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8 text-orange-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Analyzing Security Profile</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm">{currentAnalysisStep}</span>
                        <span className="text-cyan-400 text-sm font-bold">{analysisProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-slate-400">
                      <Activity className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">Deep security scan in progress...</span>
                    </div>
                  </div>
                </>
              )}

              {analysisComplete && threatAnalysisResult && (
                <>
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Security Analysis Complete!</h3>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Overall Risk Score:</span>
                      <span className={`text-2xl font-bold ${
                        threatAnalysisResult.overallRiskScore > 70 ? 'text-red-400' :
                        threatAnalysisResult.overallRiskScore > 40 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {threatAnalysisResult.overallRiskScore}/100
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Email Reputation:</span>
                      <span className={`font-semibold capitalize ${
                        threatAnalysisResult.emailReputation === 'compromised' ? 'text-red-400' :
                        threatAnalysisResult.emailReputation === 'suspicious' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {threatAnalysisResult.emailReputation}
                      </span>
                    </div>
                    
                    <div className="text-left">
                      <div className="text-slate-300 text-sm mb-2">Threat Checks Performed:</div>
                      <div className="space-y-1">
                        {threatAnalysisResult.threatChecks.map((check: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">{check.category}</span>
                            <span className={`
                              ${check.status === 'safe' ? 'text-green-400' : 
                                check.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}
                            `}>
                              {check.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Redirecting to dashboard...</span>
                  </div>
                  
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full animate-pulse w-full"></div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOnboarding;
