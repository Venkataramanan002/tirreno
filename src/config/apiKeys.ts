
export const API_KEYS = {
  // Existing APIs - Use environment variables in production
  ABSTRACT_EMAIL_REPUTATION: import.meta.env.VITE_ABSTRACT_EMAIL_REPUTATION || '35ac9929054c4f6c98e8a5dcec2c3628',
  ABSTRACT_PHONE_VALIDATION: import.meta.env.VITE_ABSTRACT_PHONE_VALIDATION || '56d96d87945f42d098f0d43e1373b4d9',
  ABSTRACT_VAT_VALIDATION: import.meta.env.VITE_ABSTRACT_VAT_VALIDATION || '3eaa3cb08c7e46e993b958d04cf4eeec',
  ENZOIC: import.meta.env.VITE_ENZOIC || '38f6c7a9cadd471288d45f35d150d9cf',
  IPINFO_TOKEN: import.meta.env.VITE_IPINFO_TOKEN || 'cce887e18d7df4',
  IPAPI_KEY: import.meta.env.VITE_IPAPI_KEY || 'cce887e18d7df4',
  VIRUSTOTAL_API_KEY: import.meta.env.VITE_VIRUSTOTAL_API_KEY || 'c1c7b1fe08b79982ab5739539cf5ad0cca9e26784be97b927358e603ebd9e3f5',
  ABUSEIPDB_API_KEY: import.meta.env.VITE_ABUSEIPDB_API_KEY || 'f16dbb2a407723405b15ab6013a58fd37d397f002e80e6f1ea20cc1b5f53d12d6f1e530a3c7bddb0',
  
  // New Threat Intelligence APIs
  SHODAN_API_KEY: import.meta.env.VITE_SHODAN_API_KEY || 'AgPWObSZdXOgz96hWFoeC3EcRRxpdNg1',
  CENSYS_API_ID: import.meta.env.VITE_CENSYS_API_ID || 'censys_RVhWqyFq_G8vvAmb5vUZNDPaXT9C4oRjb',
  CENSYS_API_SECRET: import.meta.env.VITE_CENSYS_API_SECRET || 'censys_RVhWqyFq_G8vvAmb5vUZNDPaXT9C4oRjb',
  GREYNOISE_API_KEY: import.meta.env.VITE_GREYNOISE_API_KEY || '',
  ALIENVAULT_OTX_API_KEY: import.meta.env.VITE_ALIENVAULT_OTX_API_KEY || '422e89672c8d4b3a70268fd573c4da98e43a17901b34d583bfddddf5d3a53f46',
  
  // SMS Service
  TWILIO_ACCOUNT_SID: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: import.meta.env.VITE_TWILIO_PHONE_NUMBER || '',
  
  // Database
  SUPABASE_ANON: import.meta.env.VITE_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indta25jeWt5dWJ3bm9qZ2hqamp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMTIyMjAsImV4cCI6MjA2NDU4ODIyMH0.Qn5mkW94KU1dV7uffyL4gUmhVbjXJa9hAtBc3je_oKI',
  SUPABASE_SERVICE_ROLE: import.meta.env.VITE_SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indta25jeWt5dWJ3bm9qZ2hqamp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAxMjIyMCwiZXhwIjoyMDY0NTg4MjIwfQ.Tekv7RhoWpFAynDwoUJCFjPL6dFJtgrXRNF0hpTV8uo',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://wmkncykyubwnojghjjjw.supabase.co',

  // Firebase Configuration
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCsv0OIZJSoodJSGZFkK3eTlW6x8gJZTcM',
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tirreno-a3a00.firebaseapp.com',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tirreno-a3a00',
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tirreno-a3a00.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '859748199655',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '1:859748199655:web:7d9078c874c8c0d8d18642',
  FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-Y5ZZDHE8MS'
};

// API Base URLs
export const API_BASE_URLS = {
  SHODAN: 'https://api.shodan.io',
  CENSYS: 'https://search.censys.io/api',
  GREYNOISE: 'https://api.greynoise.io',
  ALIENVAULT_OTX: 'https://otx.alienvault.com/api/v1',
  IPAPI: 'https://ipapi.co'
};
