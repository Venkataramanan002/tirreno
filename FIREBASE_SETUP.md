# Firebase Phone Authentication Setup Guide

## 🚀 Quick Start

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Phone" provider
   - Configure reCAPTCHA settings

### 2. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Supabase Configuration (for user data persistence)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON=your_supabase_anon_key
```

### 3. Database Setup

Run the Supabase migration to create Firebase user tables:

```bash
# Apply the migration
supabase db push
```

Or manually run the SQL in `supabase/migrations/20250103080000_add_firebase_users.sql`

### 4. Firebase Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🔧 Features Implemented

### ✅ Real SMS OTP Flow
- **Firebase Authentication**: Real SMS sending via Firebase
- **reCAPTCHA Integration**: Invisible reCAPTCHA for bot protection
- **OTP Verification**: Secure 6-digit code verification
- **Auto-focus & Paste**: Smart input handling with auto-focus and paste support

### ✅ User-Friendly UI
- **Compact OTP Input**: 6 individual digit inputs with auto-focus
- **Resend Logic**: 60-second cooldown with countdown timer
- **Error Handling**: Clear error messages and retry mechanisms
- **Loading States**: Visual feedback during operations

### ✅ Backend Integration
- **Supabase Persistence**: User data stored in relational database
- **Session Management**: Firebase sessions tracked in Supabase
- **Audit Logging**: Complete verification attempt logging
- **Error Tracking**: Comprehensive error logging and retry logic

### ✅ Security Features
- **Phone Number Validation**: Format validation and masking
- **Rate Limiting**: Built-in Firebase rate limiting
- **Error Logging**: Secure error tracking without sensitive data
- **Session Security**: Secure session management

## 🛠️ Technical Implementation

### Services Created:
1. **`firebasePhoneAuth.ts`** - Core Firebase phone authentication
2. **`errorHandlingService.ts`** - Error logging and retry logic
3. **`OTPInput.tsx`** - Reusable OTP input component
4. **`FirebasePhoneAuth.tsx`** - Main authentication component

### Database Tables:
- **`firebase_users`** - User profiles and metadata
- **`firebase_sessions`** - Session tracking and management
- **`firebase_verification_logs`** - Audit trail for verification attempts

## 🔒 Security Considerations

### Production Checklist:
- [ ] Enable Firebase App Check for additional security
- [ ] Configure reCAPTCHA Enterprise for advanced bot protection
- [ ] Set up Firebase Security Rules
- [ ] Enable Cloud Functions for server-side validation
- [ ] Configure rate limiting policies
- [ ] Set up monitoring and alerting

### Error Handling:
- All errors are logged securely without sensitive data
- Retry logic with exponential backoff
- User-friendly error messages
- Comprehensive audit trail

## 📱 Usage

### Basic Integration:
```tsx
import FirebasePhoneAuth from '@/components/FirebasePhoneAuth';

<FirebasePhoneAuth
  onSuccess={(user) => {
    console.log('User authenticated:', user.uid);
    // Handle successful authentication
  }}
  onBack={() => {
    // Handle back navigation
  }}
/>
```

### Service Usage:
```typescript
import { firebasePhoneAuth } from '@/services/firebasePhoneAuth';

// Send OTP
const result = await firebasePhoneAuth.sendOTP('+1234567890');

// Verify OTP
const verification = await firebasePhoneAuth.verifyOTP('123456');
```

## 🚨 Troubleshooting

### Common Issues:

1. **reCAPTCHA not loading**:
   - Check Firebase project configuration
   - Verify domain is added to authorized domains
   - Check browser console for errors

2. **SMS not received**:
   - Verify phone number format (+1234567890)
   - Check Firebase quota limits
   - Verify reCAPTCHA is solved

3. **OTP verification fails**:
   - Check code is 6 digits
   - Verify code hasn't expired (5 minutes)
   - Check for typos in code

4. **Database errors**:
   - Verify Supabase connection
   - Check RLS policies
   - Verify migration was applied

### Debug Mode:
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'firebase-phone-auth');
```

## 📊 Monitoring

### Key Metrics to Monitor:
- OTP send success rate
- OTP verification success rate
- Failed verification attempts
- Error rates by type
- User registration completion rate

### Logs Available:
- Verification attempts (success/failure)
- Error logs with context
- Session management logs
- User registration logs

## 🔄 Next Steps

1. **Enable Firebase App Check** for production
2. **Implement phone number change** functionality
3. **Add multi-factor authentication** options
4. **Set up monitoring dashboards**
5. **Implement user profile management**

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase console logs
3. Check Supabase logs
4. Review browser console for errors

---

**Note**: This implementation uses Firebase's free tier. For production use, consider upgrading to a paid plan for higher quotas and additional features.
