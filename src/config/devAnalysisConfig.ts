export const devAnalysisConfig = {
  // Gmail API Fetching
  maxEmailsToAnalyze: 50, // Number of recent emails to fetch for deep analysis

  // Phishing Detection Heuristics
  phishingKeywords: [
    'account suspended', 'verify your account', 'unusual activity', 'urgent security alert',
    'click here to renew', 'failed delivery attempt', 'update your payment', 'password reset request',
    'security notification', 'confirm your identity', 'blocked account', 'compromised account',
    'deactivated account', 'action required'
  ],
  suspiciousLinkPatterns: [
    /g00gle/i, /micr0soft/i, /paypa1/i, /amaz0n/i, /appleid/i,
    /login\.[a-z0-9-]+\.com/i, // General pattern for login subdomains on non-official sites
    /verify-[a-z0-9-]+\.info/i // General pattern for verification sites
  ],
  // Threshold for basic sender name/email mismatch check
  // e.g., "Google Support" <not-google@example.com>
  senderMismatchThreshold: 0.5, // 0 to 1, higher means more strict

  // Spam Detection Heuristics
  spamKeywords: [
    'free money', 'win now', 'guaranteed income', 'exclusive offer', 'limited time',
    'sex', 'viagra', 'cialis', 'debt relief', 'congratulations', 'lose weight',
    'get rich', 'miracle cure', 'no obligation', 'bulk email', 'opportunity'
  ],
  excessivePunctuationThreshold: 5, // e.g., "!!!"
  excessiveCapitalizationThreshold: 3, // e.g., "FREE"
  minLinkToTextRatio: 50, // lower means more links per text, higher spam score

  // Sentiment Analysis Keywords (simple, keyword-based)
  positiveKeywords: ['great', 'happy', 'success', 'opportunity', 'win', 'good', 'excellent', 'fantastic', 'amazing', 'best'],
  negativeKeywords: ['problem', 'issue', 'urgent', 'warning', 'failed', 'threat', 'scam', 'compromised', 'error', 'failed', 'bad', 'lost', 'suspicious'],

  // Language Detection (very basic keywords for dev mode demonstration)
  nonEnglishKeywords: {
    Russian: ['привет', 'спасибо', 'как дела'],
    Korean: ['안녕하세요', '감사합니다'],
    Spanish: ['hola', 'gracias', 'por favor'],
    French: ['bonjour', 'merci', 's\'il vous plaît'],
    German: ['hallo', 'danke', 'bitte']
  },

  // Keyword Extraction
  minKeywordLength: 4, // Minimum length for a word to be considered a keyword
  topKeywordsCount: 10, // Number of top keywords to extract
};
