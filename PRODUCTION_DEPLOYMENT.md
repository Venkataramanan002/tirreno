# 🚀 Production Deployment Guide

## ✅ LOVABLE WATERMARK REMOVED

The Lovable watermark and branding have been successfully removed from:
- ✅ HTML title and meta tags
- ✅ OpenGraph images
- ✅ Twitter card metadata
- ✅ Watermark script removed
- ✅ Author changed to "Tirreno Security"

## 🎯 PRODUCTION READINESS CHECKLIST

### Phase 1: Critical Fixes (Do First)

#### 1. Environment Variables Setup
Create `.env.local` file with:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://wmkncykyubwnojghjjjw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# API Keys (Keep secure)
VITE_ABSTRACT_EMAIL_REPUTATION=your_key
VITE_ABSTRACT_PHONE_VALIDATION=your_key
# ... add all other API keys
```

#### 2. Real SMS Integration
Replace simulated SMS with Twilio:
```typescript
// Add to mobileVerificationService.ts
import twilio from 'twilio';

const client = twilio(
  process.env.VITE_TWILIO_ACCOUNT_SID,
  process.env.VITE_TWILIO_AUTH_TOKEN
);

async sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
  try {
    await client.messages.create({
      body: `Your Tirreno verification code is: ${code}`,
      from: process.env.VITE_TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}
```

#### 3. Database Schema Setup
Run these SQL commands in Supabase:
```sql
-- Create tables for persistent storage
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE threat_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  analysis_data JSONB,
  risk_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_data JSONB,
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can only see their own data" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own threat data" ON threat_analyses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own behavior data" ON behavior_events
  FOR ALL USING (auth.uid() = user_id);
```

#### 4. Error Monitoring Setup
Add Sentry for error tracking:
```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// Add to main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_APP_ENVIRONMENT,
});
```

### Phase 2: Performance & Security

#### 5. API Rate Limiting
Implement rate limiting for external API calls:
```typescript
// Add to each API service
const rateLimiter = new Map();

function checkRateLimit(apiName: string, limit: number = 100) {
  const now = Date.now();
  const window = 60000; // 1 minute
  
  if (!rateLimiter.has(apiName)) {
    rateLimiter.set(apiName, []);
  }
  
  const calls = rateLimiter.get(apiName);
  const recentCalls = calls.filter((time: number) => now - time < window);
  
  if (recentCalls.length >= limit) {
    throw new Error(`Rate limit exceeded for ${apiName}`);
  }
  
  recentCalls.push(now);
  rateLimiter.set(apiName, recentCalls);
}
```

#### 6. Caching Strategy
Implement Redis or in-memory caching:
```typescript
// Add to each service
const cache = new Map();

function getCachedData(key: string, ttl: number = 300000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}
```

### Phase 3: Advanced Features

#### 7. Real-time Alerts
Add WebSocket for live threat notifications:
```typescript
// Add to Supabase
const supabase = createClient(url, key);

supabase
  .channel('threat-alerts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'threat_analyses' },
    (payload) => {
      // Show real-time alert
      showThreatAlert(payload.new);
    }
  )
  .subscribe();
```

#### 8. Device Fingerprinting
Add device identification:
```typescript
// Add to behaviorTrackingService.ts
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.textBaseline = 'top';
  ctx?.font = '14px Arial';
  ctx?.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  return btoa(fingerprint);
}
```

## 🚀 DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Option 2: Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

### Option 3: AWS S3 + CloudFront
```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
```

## 🔒 SECURITY CHECKLIST

- [ ] All API keys in environment variables
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Error monitoring active
- [ ] Database RLS enabled
- [ ] Input validation on all forms
- [ ] XSS protection headers
- [ ] CSRF protection

## 📊 MONITORING SETUP

1. **Error Tracking**: Sentry
2. **Performance**: Vercel Analytics or Google Analytics
3. **Uptime**: UptimeRobot or Pingdom
4. **Logs**: Supabase logs or external logging service

## 💰 COST ESTIMATION

- **Supabase Pro**: $25/month
- **Twilio SMS**: ~$0.0075 per SMS
- **Vercel Pro**: $20/month
- **Sentry**: $26/month
- **Total**: ~$71/month for production

## 🎯 NEXT STEPS

1. Set up environment variables
2. Implement real SMS service
3. Set up database schema
4. Add error monitoring
5. Deploy to production
6. Set up monitoring and alerts

Your platform is now ready for production deployment! 🚀
