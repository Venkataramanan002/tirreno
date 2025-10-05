import { threatIntelligenceService, ThreatIntelligenceData } from './threatIntelligenceService';
import { behaviorTrackingService, SessionData } from './behaviorTrackingService';
import { userDataService, UserProfile } from './userDataService';
import { ThreatAnalysisService } from './threatAnalysisService';
import { PhoneValidationService } from './phoneValidationService';

export interface UnifiedEnrichmentData {
  // User Profile
  userProfile: UserProfile;
  
  // Network Intelligence
  threatIntelligence: ThreatIntelligenceData;
  
  // Behavioral Data
  behaviorData: SessionData;
  
  // Email Analysis
  emailAnalysis: {
    riskScore: number;
    reputation: 'good' | 'suspicious' | 'compromised';
    recommendations: string[];
  };
  
  // Phone Analysis (if available)
  phoneAnalysis?: {
    isValid: boolean;
    riskScore: number;
    carrier: string;
    country: string;
  };
  
  // Unified Risk Assessment
  unifiedRiskScore: number;
  unifiedRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  unifiedClassification: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  
  // Data Provenance
  dataProvenance: {
    sources: string[];
    lastUpdated: number;
    cacheStatus: 'fresh' | 'cached' | 'stale';
    missingData: string[];
  };
  
  // Recommendations
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

class DataAggregationService {
  private static instance: DataAggregationService;
  private enrichmentCache = new Map<string, UnifiedEnrichmentData>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;

  static getInstance(): DataAggregationService {
    if (!DataAggregationService.instance) {
      DataAggregationService.instance = new DataAggregationService();
    }
    return DataAggregationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Data Aggregation Service...');
    
    // Start behavior tracking
    behaviorTrackingService.startTracking();
    
    this.isInitialized = true;
    console.log('✅ Data Aggregation Service initialized');
  }

  async getUnifiedEnrichmentData(forceRefresh = false): Promise<UnifiedEnrichmentData> {
    const cacheKey = 'unified_enrichment';
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.enrichmentCache.get(cacheKey);
      if (cached && Date.now() - cached.dataProvenance.lastUpdated < this.CACHE_TTL) {
        console.log('📋 Using cached unified enrichment data');
        return { ...cached, dataProvenance: { ...cached.dataProvenance, cacheStatus: 'cached' } };
      }
    }

    console.log('🔍 Generating fresh unified enrichment data...');

    try {
      // Get user profile
      const userProfile = await userDataService.initializeUserData();
      if (!userProfile) {
        throw new Error('Failed to initialize user data');
      }

      // Get threat intelligence
      const threatIntelligence = await threatIntelligenceService.getThreatIntelligence(userProfile.ipAddress);

      // Get behavior data
      const behaviorData = behaviorTrackingService.getSessionData();

      // Get email analysis
      const emailAnalysis = await this.performEmailAnalysis(userProfile.email);

      // Get phone analysis (if available)
      let phoneAnalysis = undefined;
      if (userProfile.phoneValidation) {
        phoneAnalysis = {
          isValid: userProfile.phoneValidation.isValid || false,
          riskScore: userProfile.phoneValidation.riskScore || 0,
          carrier: userProfile.phoneValidation.carrier || 'Unknown',
          country: userProfile.phoneValidation.country || 'Unknown'
        };
      }

      // Calculate unified risk assessment
      const unifiedRisk = this.calculateUnifiedRisk({
        userProfile,
        threatIntelligence,
        behaviorData,
        emailAnalysis,
        phoneAnalysis
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations(unifiedRisk);

      // Determine data provenance
      const dataProvenance = this.assessDataProvenance({
        userProfile,
        threatIntelligence,
        behaviorData,
        emailAnalysis,
        phoneAnalysis
      });

      const enrichmentData: UnifiedEnrichmentData = {
        userProfile,
        threatIntelligence,
        behaviorData,
        emailAnalysis,
        phoneAnalysis,
        unifiedRiskScore: unifiedRisk.score,
        unifiedRiskLevel: unifiedRisk.level,
        unifiedClassification: unifiedRisk.classification,
        dataProvenance,
        recommendations
      };

      // Cache the result
      this.enrichmentCache.set(cacheKey, enrichmentData);

      console.log('✅ Unified enrichment data generated successfully');
      return enrichmentData;

    } catch (error) {
      console.error('❌ Failed to generate unified enrichment data:', error);
      throw error;
    }
  }

  private async performEmailAnalysis(email: string): Promise<{
    riskScore: number;
    reputation: 'good' | 'suspicious' | 'compromised';
    recommendations: string[];
  }> {
    try {
      const analysis = await ThreatAnalysisService.performEmailAnalysis(email, () => {});
      return {
        riskScore: analysis.overallRiskScore,
        reputation: analysis.emailReputation,
        recommendations: analysis.recommendations
      };
    } catch (error) {
      console.warn('⚠️ Email analysis failed:', error);
      return {
        riskScore: 50,
        reputation: 'suspicious',
        recommendations: ['Email analysis unavailable']
      };
    }
  }

  private calculateUnifiedRisk(data: {
    userProfile: UserProfile;
    threatIntelligence: ThreatIntelligenceData;
    behaviorData: SessionData;
    emailAnalysis: any;
    phoneAnalysis?: any;
  }): {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    classification: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  } {
    let totalScore = 0;
    let weightSum = 0;

    // User profile risk (weight: 2)
    totalScore += data.userProfile.riskScore * 2;
    weightSum += 2;

    // Threat intelligence risk (weight: 3)
    totalScore += data.threatIntelligence.riskScore * 3;
    weightSum += 3;

    // Email analysis risk (weight: 2)
    totalScore += data.emailAnalysis.riskScore * 2;
    weightSum += 2;

    // Phone analysis risk (weight: 1)
    if (data.phoneAnalysis) {
      totalScore += data.phoneAnalysis.riskScore * 1;
      weightSum += 1;
    }

    // Behavior risk (weight: 1)
    const behaviorRisk = this.calculateBehaviorRisk(data.behaviorData);
    totalScore += behaviorRisk * 1;
    weightSum += 1;

    // Network security flags (weight: 2)
    const networkRisk = this.calculateNetworkRisk(data.userProfile, data.threatIntelligence);
    totalScore += networkRisk * 2;
    weightSum += 2;

    const finalScore = Math.min(100, Math.round(totalScore / weightSum));

    let level: 'low' | 'medium' | 'high' | 'critical';
    let classification: 'malicious' | 'suspicious' | 'benign' | 'unknown';

    if (finalScore >= 80) {
      level = 'critical';
      classification = 'malicious';
    } else if (finalScore >= 60) {
      level = 'high';
      classification = 'malicious';
    } else if (finalScore >= 40) {
      level = 'medium';
      classification = 'suspicious';
    } else if (finalScore >= 20) {
      level = 'low';
      classification = 'benign';
    } else {
      level = 'low';
      classification = 'benign';
    }

    return {
      score: finalScore,
      level,
      classification
    };
  }

  private calculateBehaviorRisk(behaviorData: SessionData): number {
    let risk = 0;

    // Short session duration might indicate automated behavior
    if (behaviorData.duration < 30000) { // Less than 30 seconds
      risk += 20;
    }

    // Very high action count might indicate bot behavior
    if (behaviorData.actions > 1000) {
      risk += 15;
    }

    // Multiple page views in short time might indicate scanning
    if (behaviorData.pageViews > 10) {
      risk += 10;
    }

    return Math.min(100, risk);
  }

  private calculateNetworkRisk(userProfile: UserProfile, threatIntelligence: ThreatIntelligenceData): number {
    let risk = 0;

    // Proxy/VPN/Tor detection
    if (userProfile.isProxy) risk += 20;
    if (userProfile.isVpn) risk += 15;
    if (userProfile.isTor) risk += 40;

    // Hosting service detection
    if (userProfile.isHosting) risk += 10;

    // Threat intelligence classification
    if (threatIntelligence.classification === 'malicious') risk += 50;
    else if (threatIntelligence.classification === 'suspicious') risk += 25;

    return Math.min(100, risk);
  }

  private generateRecommendations(unifiedRisk: {
    score: number;
    level: string;
    classification: string;
  }): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    };

    if (unifiedRisk.level === 'critical') {
      recommendations.immediate.push('🚨 IMMEDIATE ACTION REQUIRED: Critical risk detected');
      recommendations.immediate.push('🔐 Enable additional security measures immediately');
      recommendations.immediate.push('👀 Monitor all account activities closely');
    } else if (unifiedRisk.level === 'high') {
      recommendations.immediate.push('⚠️ High risk detected - review security settings');
      recommendations.shortTerm.push('🔐 Implement two-factor authentication');
    } else if (unifiedRisk.level === 'medium') {
      recommendations.shortTerm.push('📋 Review security recommendations');
      recommendations.shortTerm.push('🔄 Update passwords regularly');
    } else {
      recommendations.longTerm.push('✅ Maintain current security practices');
      recommendations.longTerm.push('🔄 Regular security checkups recommended');
    }

    return recommendations;
  }

  private assessDataProvenance(data: any): {
    sources: string[];
    lastUpdated: number;
    cacheStatus: 'fresh' | 'cached' | 'stale';
    missingData: string[];
  } {
    const sources: string[] = [];
    const missingData: string[] = [];
    let lastUpdated = Date.now();

    // Check data sources
    if (data.userProfile) sources.push('User Profile');
    if (data.threatIntelligence?.sources) sources.push(...data.threatIntelligence.sources);
    if (data.emailAnalysis) sources.push('Email Analysis');
    if (data.phoneAnalysis) sources.push('Phone Analysis');
    if (data.behaviorData) sources.push('Behavior Tracking');

    // Check for missing data
    if (!data.phoneAnalysis) missingData.push('Phone Validation');
    if (!data.threatIntelligence?.shodan) missingData.push('Shodan Intelligence');
    if (!data.threatIntelligence?.censys) missingData.push('Censys Intelligence');
    if (!data.threatIntelligence?.greynoise) missingData.push('GreyNoise Intelligence');
    if (!data.threatIntelligence?.alienvault) missingData.push('AlienVault Intelligence');

    return {
      sources: [...new Set(sources)],
      lastUpdated,
      cacheStatus: 'fresh',
      missingData
    };
  }

  // Clear all caches
  clearAllCaches(): void {
    this.enrichmentCache.clear();
    threatIntelligenceService.clearCache();
    console.log('🧹 All caches cleared');
  }

  // Get cache statistics
  getCacheStats(): any {
    return {
      enrichmentCache: {
        size: this.enrichmentCache.size,
        keys: Array.from(this.enrichmentCache.keys())
      },
      threatIntelligence: threatIntelligenceService.getCacheStats()
    };
  }
}

export const dataAggregationService = DataAggregationService.getInstance();
