# Tirreno - Cybersecurity Platform

## Overview
Tirreno is a Vite + React + TypeScript cybersecurity platform with AI-driven security analysis features. It provides real-time threat detection, user behavior monitoring, and comprehensive security dashboards.

## Project Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Charts**: Recharts

### Directory Structure
```
src/
├── components/       # React components (Dashboard, ThreatDetection, UserManagement, etc.)
├── services/         # API services and data aggregation
│   ├── api.ts                     # Base API client
│   ├── ipService.ts               # IPify & IPInfo integration
│   ├── googleService.ts           # Google OAuth and Gmail API
│   ├── threatIntelligenceService.ts # Shodan, Censys, GreyNoise, AlienVault
│   ├── dataAggregationService.ts  # Unified data enrichment
│   ├── userDataService.ts         # User data aggregation
│   └── behaviorTrackingService.ts # Session behavior tracking
├── config/           # Configuration files
│   └── apiKeys.ts    # API keys configuration
├── pages/            # Page components (OAuthCallback, etc.)
├── hooks/            # Custom React hooks
└── lib/              # Utility functions
```

### Data Flow
1. **IP Detection**: IPify API → IPInfo API → Real location data
2. **Google OAuth**: Stores real profile data in localStorage
3. **Gmail API**: Stores email metadata/settings in localStorage
4. **Threat Intelligence**: Shodan, Censys, GreyNoise, AlienVault APIs
5. **Components**: Read from localStorage with proper loading/error states

### Key Features
- Real-time IP and location detection
- Google OAuth integration for user profile
- Gmail API integration for email security analysis
- Multi-source threat intelligence (Shodan, Censys, GreyNoise, AlienVault)
- User behavior tracking and session monitoring
- Risk score calculation and classification
- PDF report generation

## Development

### Running Locally
```bash
npm install
npm run dev
```
The development server runs on port 5000.

### Building for Production
```bash
npm run build
```
Output is in the `dist` directory.

## Deployment
- **Type**: Static site deployment
- **Build Command**: `npm run build`
- **Public Directory**: `dist`

## Recent Changes
- Configured Vite for Replit proxy compatibility
- Fixed LSP errors in service files
- Verified all API integrations work correctly
- All components properly display loading/error states
