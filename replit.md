# Email Threat Analysis Platform

## Overview
An AI-powered security platform for email threat analysis. Detects phishing, malware, and suspicious activity before they become threats.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Backend Services**: Supabase, Firebase

## Project Structure
```
src/
├── components/      # React components including shadcn/ui
├── config/          # API keys and Firebase configuration
├── data/            # Sample data
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client
├── lib/             # Utility functions
├── pages/           # Route pages
├── services/        # API and business logic services
└── utils/           # Helper utilities
```

## Development
- **Port**: 5000 (frontend)
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`

## Configuration
- Vite is configured with `allowedHosts: true` for Replit proxy compatibility
- Host binds to `0.0.0.0` for network access
