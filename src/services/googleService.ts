export interface GoogleProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  locale?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
}

export interface GooglePeopleProfile {
  resourceName?: string;
  names?: Array<{
    displayName?: string;
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses?: Array<{
    value?: string;
    metadata?: {
      verified?: boolean;
    };
  }>;
  photos?: Array<{
    url?: string;
  }>;
  locales?: Array<{
    value?: string;
  }>;
}

export interface GmailMessageMeta {
  id: string;
  threadId: string;
  snippet?: string;
  payloadHeaders?: Array<{ name: string; value: string }>;
  internalDate?: string;
}

export interface GmailMetadata {
  totalInboxCount: number;
  totalSpamCount: number;
  totalUnreadCount: number;
  uniqueSenders: string[];
  suspiciousDomains: string[];
  lastMessageTimestamps: string[];
  labels: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface GmailSettings {
  forwardingEnabled: boolean;
  forwardingAddress?: string;
  popEnabled: boolean;
  imapEnabled: boolean;
  autoReplyEnabled: boolean;
  autoReplyMessage?: string;
  signature?: string;
  delegatedAccounts: Array<{
    email: string;
    verificationStatus: string;
  }>;
}

export interface GoogleRealData {
  profile: {
    name: string | null;
    email: string | null;
    picture: string | null;
    locale: string | null;
    emailVerified: boolean | null;
    accountCreationTime?: string | null;
    recoveryEmailStatus: boolean | null;
  };
  gmailMetadata: {
    totalInboxCount: number | null;
    totalSpamCount: number | null;
    totalUnreadCount: number | null;
    uniqueSenders: string[] | null;
    suspiciousDomains: string[] | null;
    lastMessageTimestamps: string[] | null;
    labels: Array<{ id: string; name: string; type: string }> | null;
  };
  gmailSettings: {
    forwardingEnabled: boolean | null;
    forwardingAddress: string | null;
    popEnabled: boolean | null;
    imapEnabled: boolean | null;
    autoReplyEnabled: boolean | null;
    autoReplyMessage: string | null;
    signature: string | null;
    delegatedAccounts: Array<{ email: string; verificationStatus: string }> | null;
  };
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch Google profile');
  return await res.json();
}

export async function fetchGmailMetadata(accessToken: string, maxResults: number = 20): Promise<string[]> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error('Failed to fetch Gmail metadata');
  const data = await res.json();
  const messages: Array<{ id: string }> = data?.messages || [];
  return messages.map(m => m.id);
}

export async function fetchGmailMessages(accessToken: string, messageIds: string[]): Promise<GmailMessageMeta[]> {
  const results: GmailMessageMeta[] = [];
  for (const id of messageIds) {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) continue;
    const data = await res.json();
    results.push({
      id: data.id,
      threadId: data.threadId,
      snippet: data.snippet,
      payloadHeaders: data?.payload?.headers || [],
      internalDate: data.internalDate
    });
  }
  return results;
}

/**
 * Fetch enhanced Google profile from People API
 */
export async function fetchGooglePeopleProfile(accessToken: string): Promise<GooglePeopleProfile | null> {
  try {
    const res = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos,locales,metadata', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('Failed to fetch Google People profile:', error);
    return null;
  }
}

/**
 * Fetch account creation time and recovery email status from People API
 */
export async function fetchAccountMetadata(accessToken: string): Promise<{
  accountCreationTime: string | null;
  recoveryEmailStatus: boolean | null;
}> {
  try {
    // Try to get account metadata from People API
    const res = await fetch('https://people.googleapis.com/v1/people/me?personFields=metadata', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      // Extract account creation time from metadata if available
      const accountCreationTime = data.metadata?.sources?.[0]?.updateTime || null;
      
      // Check for recovery email (secondary email addresses)
      const emailAddresses = data.emailAddresses || [];
      const recoveryEmailStatus = emailAddresses.length > 1; // Has recovery email if more than primary
      
      return {
        accountCreationTime,
        recoveryEmailStatus
      };
    }
    
    return { accountCreationTime: null, recoveryEmailStatus: null };
  } catch (error) {
    console.warn('Failed to fetch account metadata:', error);
    return { accountCreationTime: null, recoveryEmailStatus: null };
  }
}

/**
 * Fetch comprehensive Gmail metadata (NO email body)
 */
export async function fetchGmailComprehensiveMetadata(accessToken: string): Promise<GmailMetadata | null> {
  try {
    // Get inbox messages
    const inboxRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox&maxResults=500', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!inboxRes.ok) return null;
    const inboxData = await inboxRes.json();
    const inboxMessages: Array<{ id: string }> = inboxData?.messages || [];

    // Get spam messages
    const spamRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:spam&maxResults=500', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const spamData = spamRes.ok ? await spamRes.json() : { messages: [] };
    const spamMessages: Array<{ id: string }> = spamData?.messages || [];

    // Get unread messages
    const unreadRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=500', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const unreadData = unreadRes.ok ? await unreadRes.json() : { messages: [] };
    const unreadMessages: Array<{ id: string }> = unreadData?.messages || [];

    // Get labels
    const labelsRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const labelsData = labelsRes.ok ? await labelsRes.json() : { labels: [] };
    const labels = (labelsData?.labels || []).map((label: any) => ({
      id: label.id,
      name: label.name,
      type: label.type || 'user'
    }));

    // Fetch metadata for last 5 messages to get senders and timestamps
    const lastMessageIds = inboxMessages.slice(0, 5).map(m => m.id);
    const uniqueSenders = new Set<string>();
    const suspiciousDomains = new Set<string>();
    const lastMessageTimestamps: string[] = [];
    const suspiciousDomainPatterns = /(temp|fake|throwaway|10min|guerrillamail|mailinator|trashmail)/i;

    for (const id of lastMessageIds) {
      try {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const headers = msgData?.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name === 'From');
          
          if (fromHeader?.value) {
            const emailMatch = fromHeader.value.match(/<(.+?)>/);
            const email = emailMatch ? emailMatch[1] : fromHeader.value;
            const domain = email.split('@')[1];
            
            uniqueSenders.add(email);
            if (suspiciousDomainPatterns.test(domain)) {
              suspiciousDomains.add(domain);
            }
          }
          
          if (msgData.internalDate) {
            lastMessageTimestamps.push(new Date(parseInt(msgData.internalDate)).toISOString());
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch message ${id}:`, error);
      }
    }

    return {
      totalInboxCount: inboxMessages.length,
      totalSpamCount: spamMessages.length,
      totalUnreadCount: unreadMessages.length,
      uniqueSenders: Array.from(uniqueSenders),
      suspiciousDomains: Array.from(suspiciousDomains),
      lastMessageTimestamps,
      labels
    };
  } catch (error) {
    console.warn('Failed to fetch Gmail comprehensive metadata:', error);
    return null;
  }
}

/**
 * Fetch Gmail account settings
 */
export async function fetchGmailSettings(accessToken: string): Promise<GmailSettings | null> {
  try {
    // Get forwarding settings
    let forwardingEnabled = false;
    let forwardingAddress: string | undefined = undefined;
    try {
      const forwardingRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/settings/forwardingAddresses', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (forwardingRes.ok) {
        const forwardingData = await forwardingRes.json();
        const addresses = forwardingData?.forwardingAddresses || [];
        if (addresses.length > 0) {
          forwardingEnabled = true;
          forwardingAddress = addresses[0].forwardingEmail;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch forwarding settings:', error);
    }

    // Get POP/IMAP settings
    let popEnabled = false;
    let imapEnabled = false;
    try {
      const popRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/settings/pop', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (popRes.ok) {
        const popData = await popRes.json();
        popEnabled = popData?.enableFor?.includes('ALL') || false;
      }
    } catch (error) {
      console.warn('Failed to fetch POP settings:', error);
    }

    try {
      const imapRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/settings/imap', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (imapRes.ok) {
        const imapData = await imapRes.json();
        imapEnabled = imapData?.enabled || false;
      }
    } catch (error) {
      console.warn('Failed to fetch IMAP settings:', error);
    }

    // Get auto-reply (vacation) settings
    let autoReplyEnabled = false;
    let autoReplyMessage: string | undefined = undefined;
    try {
      const vacationRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/settings/vacation', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (vacationRes.ok) {
        const vacationData = await vacationRes.json();
        autoReplyEnabled = vacationData?.enableAutoReply || false;
        autoReplyMessage = vacationData?.responseBodyPlainText;
      }
    } catch (error) {
      console.warn('Failed to fetch vacation settings:', error);
    }

    // Get signature
    let signature: string | undefined = undefined;
    try {
      const sendAsRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (sendAsRes.ok) {
        const sendAsData = await sendAsRes.json();
        const primarySendAs = sendAsData?.sendAs?.find((sa: any) => sa.isPrimary);
        signature = primarySendAs?.signature;
      }
    } catch (error) {
      console.warn('Failed to fetch signature:', error);
    }

    // Get delegated accounts
    let delegatedAccounts: Array<{ email: string; verificationStatus: string }> = [];
    try {
      const delegatesRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/settings/delegates', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (delegatesRes.ok) {
        const delegatesData = await delegatesRes.json();
        delegatedAccounts = (delegatesData?.delegates || []).map((d: any) => ({
          email: d.delegateEmail,
          verificationStatus: d.verificationStatus || 'unknown'
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch delegated accounts:', error);
    }

    return {
      forwardingEnabled,
      forwardingAddress,
      popEnabled,
      imapEnabled,
      autoReplyEnabled,
      autoReplyMessage,
      signature,
      delegatedAccounts
    };
  } catch (error) {
    console.warn('Failed to fetch Gmail settings:', error);
    return null;
  }
}

/**
 * Unified function to fetch all real Google data
 */

// =================================================================================
// DEV MODE GMAIL ANALYSIS - Added functionality for developer-specific deep analysis
// =================================================================================

export interface ConnectedApp {
  name: string;
  date: string;
}

export interface VisitedWebsite {
  domain: string;
  count: number;
}

export interface SuspiciousActivity {
  failedAuthMessages: Array<{ from: string; subject: string; reason: string; date: string; }>;
  loginAlerts: Array<{ device: string; ip: string; location: string; date: string; }>;
  extractedLinks: Array<{ link: string; source: string }>;
}

export interface DevGmailAnalysisData {
  connectedApps: ConnectedApp[];
  visitedWebsites: VisitedWebsite[];
  suspiciousActivity: SuspiciousActivity;
}

// Helper to decode base64 email body
function decodeEmailBody(parts: any[]): string {
  if (!parts) return "";
  let body = "";
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      try {
        body += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } catch (e) {
        console.warn('Failed to decode base64 email body part:', e);
        // Optionally, handle non-base64 or malformed data more gracefully
      }
    } else if (part.parts) {
      body += decodeEmailBody(part.parts);
    }
  }
  return body;
}

// Generic helper to search Gmail and fetch message details
async function searchAndFetchGmail(accessToken: string, query: string, maxResults: number, format: 'full' | 'metadata' | 'raw', headersToInclude: string[] = []) {
  const metadataHeaders = headersToInclude.length > 0 ? `&metadataHeaders=${headersToInclude.join('&metadataHeaders=')}` : '';
  const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!searchRes.ok) {
    console.error('Gmail search failed:', await searchRes.text());
    return [];
  }
  const searchData = await searchRes.json();
  const messageIds = searchData.messages?.map((m: any) => m.id) || [];

  const messages = [];
  for (const id of messageIds) {
    const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=${format}${metadataHeaders}`;
    const messageRes = await fetch(messageUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (messageRes.ok) {
      messages.push(await messageRes.json());
    }
  }
  return messages;
}

/**
 * [DEV] Identifies connected apps from security notifications.
 */
async function getConnectedApps(accessToken: string): Promise<ConnectedApp[]> {
  const messages = await searchAndFetchGmail(accessToken, 'from:no-reply@accounts.google.com "was granted access"', 15, 'full');
  const apps: ConnectedApp[] = [];
  const appRegex = /(.+?)\s+was granted access/;
  for (const msg of messages) {
    const body = decodeEmailBody(msg.payload?.parts);
    const match = body.match(appRegex);
    if (match && match[1]) {
      const appName = match[1].trim();
      const dateHeader = msg.payload.headers.find((h: any) => h.name.toLowerCase() === 'date');
      apps.push({
        name: appName,
        date: dateHeader ? new Date(dateHeader.value).toISOString().split('T')[0] : 'Unknown Date',
      });
    }
  }
  return apps;
}

/**
 * [DEV] Tracks "visited" websites from registration emails.
 */
async function getVisitedWebsites(accessToken: string): Promise<VisitedWebsite[]> {
  const messages = await searchAndFetchGmail(accessToken, '"verify your email" OR "welcome to" OR "confirm your subscription"', 50, 'metadata', ['From']);
  const domains: { [key: string]: number } = {};
  const domainRegex = /@([^>]+)/;

  for (const msg of messages) {
    const fromHeader = msg.payload.headers.find((h: any) => h.name === 'From');
    if (fromHeader) {
      const match = fromHeader.value.match(domainRegex);
      if (match && match[1]) {
        const domain = match[1];
        domains[domain] = (domains[domain] || 0) + 1;
      }
    }
  }
  return Object.entries(domains).map(([domain, count]) => ({ domain, count })).sort((a,b) => b.count - a.count);
}

/**
 * [DEV] Detects suspicious activity from headers, alerts, and links.
 */
async function getSuspiciousActivity(accessToken: string): Promise<SuspiciousActivity> {
  const result: SuspiciousActivity = {
    failedAuthMessages: [],
    loginAlerts: [],
    extractedLinks: [],
  };

  // 1. Check for failed auth in recent messages
  const recentMessages = await searchAndFetchGmail(accessToken, '', 20, 'metadata', ['Authentication-Results', 'From', 'Subject', 'Date']);
  for (const msg of recentMessages) {
      const authHeader = msg.payload.headers.find((h:any) => h.name === 'Authentication-Results');
      if (authHeader && (authHeader.value.includes('spf=fail') || authHeader.value.includes('dkim=fail'))) {
          const from = msg.payload.headers.find((h:any) => h.name === 'From')?.value || 'Unknown Sender';
          const subject = msg.payload.headers.find((h:any) => h.name === 'Subject')?.value || 'No Subject';
          const date = msg.payload.headers.find((h:any) => h.name === 'Date')?.value || new Date().toISOString();
          result.failedAuthMessages.push({ from, subject, reason: authHeader.value, date: new Date(date).toISOString() });
      }
  }

  // 2. Look for sign-in alerts
  const loginAlertMessages = await searchAndFetchGmail(accessToken, 'subject:"Security alert" OR subject:"Sign-in alert"', 10, 'full');
  for (const msg of loginAlertMessages) {
    const body = decodeEmailBody(msg.payload?.parts);
    const ipMatch = body.match(/IP address: ([\d.]+)/);
    const deviceMatch = body.match(/Device: (.*?)\n/);
    const locationMatch = body.match(/Location: (.*?)\n/);
    const dateHeader = msg.payload.headers.find((h: any) => h.name.toLowerCase() === 'date');
    if (ipMatch) {
      result.loginAlerts.push({
        ip: ipMatch[1],
        device: deviceMatch ? deviceMatch[1] : 'Unknown Device',
        location: locationMatch ? locationMatch[1] : 'Unknown Location',
        date: dateHeader ? new Date(dateHeader.value).toISOString() : 'Unknown Date',
      });
    }
  }
  
  // 3. Extract links from email bodies
  const messagesForLinks = await searchAndFetchGmail(accessToken, 'has:nouserlabels', 10, 'full');
  const urlRegex = /https?:\/\/[^\s"<>]+/g;
  for (const msg of messagesForLinks) {
      const body = decodeEmailBody(msg.payload?.parts);
      const links = body.match(urlRegex);
      if (links) {
          const subject = msg.payload.headers.find((h:any) => h.name === 'Subject')?.value || 'No Subject';
          links.forEach(link => result.extractedLinks.push({ link, source: `Email: "${subject}"`}));
      }
  }

  // 4. Check links against Google Safe Browsing API if key is available
  if (API_KEYS.GOOGLE_SAFE_BROWSING_API_KEY && result.extractedLinks.length > 0) {
    // This is where you would implement the call to the Safe Browsing API.
    // For this fix, we are just ensuring the code doesn't crash if the key is missing.
    // The actual implementation would look something like this:
    /*
    const safeBrowsingUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEYS.GOOGLE_SAFE_BROWSING_API_KEY}`;
    const threats = result.extractedLinks.map(l => ({ url: l.link }));
    try {
      const res = await fetch(safeBrowsingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'your-app-name', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: threats,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Process the results to flag malicious links
      }
    } catch (e) {
      console.error("Safe Browsing API call failed:", e);
    }
    */
  } else if (result.extractedLinks.length > 0) {
      console.warn("Google Safe Browsing API key not configured. Skipping link analysis.");
  }

  return result;
}


/**
 * [DEV] Unified function to fetch all dev-mode specific Gmail analysis data.
 */
export async function fetchDevGmailAnalysis(accessToken: string): Promise<DevGmailAnalysisData> {
  const [connectedApps, visitedWebsites, suspiciousActivity] = await Promise.all([
    getConnectedApps(accessToken),
    getVisitedWebsites(accessToken),
    getSuspiciousActivity(accessToken),
  ]);

  return {
    connectedApps,
    visitedWebsites,
    suspiciousActivity,
  };
}

export interface DeepGmailAnalysisResult {
  phishingAttempts: PhishingAttempt[];
  spamEmails: SpamEmail[];
  suspiciousLanguage: SuspiciousLanguage[];
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  topKeywords: { word: string; count: number }[];
  totalAnalyzed: number;
}

export interface PhishingAttempt {
  subject: string;
  sender: string;
  reason: string;
  links: string[];
  date: string;
}

export interface SpamEmail {
  subject: string;
  sender: string;
  reason: string;
  date: string;
}

export interface SuspiciousLanguage {
  subject: string;
  sender: string;
  language: string;
  date: string;
}

import { API_KEYS } from "@/config/apiKeys";
import { devAnalysisConfig } from "@/config/devAnalysisConfig";

// Helper to extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s"<>]+)/g;
  return (text.match(urlRegex) || []).filter(url => {
      try {
          new URL(url); // Basic URL validation
          return true;
      } catch {
          return false;
      }
  });
}

// Simple keyword-based sentiment analysis
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();

  let score = 0;
  devAnalysisConfig.positiveKeywords.forEach(keyword => { if (lowerText.includes(keyword)) score++; });
  devAnalysisConfig.negativeKeywords.forEach(keyword => { if (lowerText.includes(keyword)) score--; });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// Very basic language detection (for dev mode, not robust)
function detectLanguage(text: string): string {
    const lowerText = text.toLowerCase();
    for (const lang in devAnalysisConfig.nonEnglishKeywords) {
        if (devAnalysisConfig.nonEnglishKeywords[lang].some(keyword => lowerText.includes(keyword))) {
            return lang;
        }
    }
    // Check for common non-ASCII characters
    if (/[а-яА-ЯёЁ]/.test(text)) return 'Russian';
    if (/[ㄱ-ㅎ가-힣]/.test(text)) return 'Korean';
    if (/[一-龠]/.test(text)) return 'Chinese/Japanese';
    if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
    if (/[áéíóúÁÉÍÓÚñÑüÜ]/.test(text)) return 'Spanish';
    
    return 'English'; // Default
}

// Core function to analyze single email content for deep insights
function analyzeEmailContent(email: any): {
  isPhishing: boolean;
  phishingReason: string;
  isSpam: boolean;
  spamReason: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  language: string;
  extractedKeywords: string[];
  extractedLinks: string[];
} {
  const subject = email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '';
  const sender = email.payload?.headers?.find((h: any) => h.name === 'From')?.value || '';
  const body = decodeEmailBody(email.payload?.parts || []);
  const fullText = subject + ' ' + body;

  let isPhishing = false;
  let phishingReason = '';
  let isSpam = false;
  let spamReason = '';

  const extractedLinks = extractUrls(fullText);

  // Phishing heuristics
  if (devAnalysisConfig.phishingKeywords.some(keyword => fullText.toLowerCase().includes(keyword))) {
    isPhishing = true;
    phishingReason = 'Contains phishing-related keywords.';
  }
  if (devAnalysisConfig.suspiciousLinkPatterns.some(pattern => extractedLinks.some(link => pattern.test(link)))) {
    isPhishing = true;
    phishingReason = (phishingReason ? phishingReason + ' ' : '') + 'Contains suspicious-looking links.';
  }
  // Check for sender display name vs email mismatch - basic check
  const senderEmailMatch = sender.match(/<(.+?)>/);
  const senderDisplayNameMatch = sender.match(/^"(.+?)"/);
  if (senderEmailMatch && senderDisplayNameMatch && senderEmailMatch[1] && senderDisplayNameMatch[1]) {
      const displayName = senderDisplayNameMatch[1].toLowerCase();
      const emailDomain = senderEmailMatch[1].split('@')[1].toLowerCase();
      if (!displayName.includes(emailDomain.split('.')[0])) {
          isPhishing = true;
          phishingReason = (phishingReason ? phishingReason + ' ' : '') + 'Sender display name/email mismatch.';
      }
  }


  // Spam heuristics
  if (devAnalysisConfig.spamKeywords.some(keyword => fullText.toLowerCase().includes(keyword))) {
    isSpam = true;
    spamReason = 'Contains spam-related keywords.';
  }
  if ((fullText.match(/!/g) || []).length > devAnalysisConfig.excessivePunctuationThreshold || (fullText.match(/[A-Z]{3,}/g) || []).length > devAnalysisConfig.excessiveCapitalizationThreshold) {
    isSpam = true;
    spamReason = (spamReason ? spamReason + ' ' : '') + 'Excessive punctuation/capitalization.';
  }
  if (extractedLinks.length > devAnalysisConfig.minLinkToTextRatio && (fullText.length / extractedLinks.length < devAnalysisConfig.minLinkToTextRatio)) {
      isSpam = true;
      spamReason = (spamReason ? spamReason + ' ' : '') + 'High link-to-text ratio.';
  }

  const sentiment = analyzeSentiment(fullText);
  const language = detectLanguage(fullText.substring(0, 200)); // Analyze first 200 chars for language

  // Extract top keywords (simple word frequency)
  const words = fullText.toLowerCase().match(new RegExp(`\\b\\w{${devAnalysisConfig.minKeywordLength},}\\b`, 'g')) || [];
  const wordCounts: { [key: string]: number } = {};
  words.forEach(word => { wordCounts[word] = (wordCounts[word] || 0) + 1; });
  const extractedKeywords = Object.entries(wordCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, devAnalysisConfig.topKeywordsCount)
    .map(([word]) => word);


  return { isPhishing, phishingReason, isSpam, spamReason, sentiment, language, extractedKeywords, extractedLinks };
}

/**
 * [DEV] Deep dive content analysis for Gmail messages.
 */
export async function fetchDevDeepGmailAnalysis(accessToken: string): Promise<DeepGmailAnalysisResult> {
  const messages = await searchAndFetchGmail(accessToken, '', devAnalysisConfig.maxEmailsToAnalyze, 'full'); // Fetch last X messages
  
  const phishingAttempts: PhishingAttempt[] = [];
  const spamEmails: SpamEmail[] = [];
  const suspiciousLanguage: SuspiciousLanguage[] = [];
  let positiveSentiment = 0;
  let negativeSentiment = 0;
  let neutralSentiment = 0;
  const allKeywords: { [key: string]: number } = {};
  let totalAnalyzed = 0;

  for (const msg of messages) {
    totalAnalyzed++;
    const analysis = analyzeEmailContent(msg);
    const subject = msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
    const sender = msg.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
    const date = msg.payload?.headers?.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();


    if (analysis.isPhishing) {
      phishingAttempts.push({
        subject,
        sender,
        reason: analysis.phishingReason,
        links: analysis.extractedLinks,
        date: new Date(date).toISOString(),
      });
    }
    if (analysis.isSpam) {
      spamEmails.push({
        subject,
        sender,
        reason: analysis.spamReason,
        date: new Date(date).toISOString(),
      });
    }
    if (analysis.language !== 'English' && analysis.language !== 'Unknown') {
        suspiciousLanguage.push({
            subject,
            sender,
            language: analysis.language,
            date: new Date(date).toISOString(),
        });
    }
    
    if (analysis.sentiment === 'positive') positiveSentiment++;
    if (analysis.sentiment === 'negative') negativeSentiment++;
    else neutralSentiment++; // If not positive or negative, then neutral

    analysis.extractedKeywords.forEach(keyword => {
      allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
    });
  }

  const topKeywords = Object.entries(allKeywords)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, devAnalysisConfig.topKeywordsCount)
    .map(([word, count]) => ({ word, count }));

  return {
    phishingAttempts,
    spamEmails,
    suspiciousLanguage,
    sentimentBreakdown: { positive: positiveSentiment, negative: negativeSentiment, neutral: neutralSentiment },
    topKeywords,
    totalAnalyzed,
  };
}

export async function fetchRealGoogleData(accessToken: string): Promise<GoogleRealData> {
  const result: GoogleRealData = {
    profile: {
      name: null,
      email: null,
      picture: null,
      locale: null,
      emailVerified: null,
      accountCreationTime: null,
      recoveryEmailStatus: null
    },
    gmailMetadata: {
      totalInboxCount: null,
      totalSpamCount: null,
      totalUnreadCount: null,
      uniqueSenders: null,
      suspiciousDomains: null,
      lastMessageTimestamps: null,
      labels: null
    },
    gmailSettings: {
      forwardingEnabled: null,
      forwardingAddress: null,
      popEnabled: null,
      imapEnabled: null,
      autoReplyEnabled: null,
      autoReplyMessage: null,
      signature: null,
      delegatedAccounts: null
    }
  };

  try {
    // Fetch basic profile (fallback to userinfo if People API fails)
    try {
      const peopleProfile = await fetchGooglePeopleProfile(accessToken);
      if (peopleProfile) {
        result.profile.name = peopleProfile.names?.[0]?.displayName || 
                             `${peopleProfile.names?.[0]?.givenName || ''} ${peopleProfile.names?.[0]?.familyName || ''}`.trim() || null;
        result.profile.email = peopleProfile.emailAddresses?.[0]?.value || null;
        result.profile.emailVerified = peopleProfile.emailAddresses?.[0]?.metadata?.verified || null;
        result.profile.picture = peopleProfile.photos?.[0]?.url || null;
        result.profile.locale = peopleProfile.locales?.[0]?.value || null;
      }
    } catch (error) {
      console.warn('People API failed, falling back to userinfo:', error);
    }

    // Fetch account metadata (creation time and recovery email status)
    try {
      const accountMetadata = await fetchAccountMetadata(accessToken);
      result.profile.accountCreationTime = accountMetadata.accountCreationTime;
      result.profile.recoveryEmailStatus = accountMetadata.recoveryEmailStatus;
    } catch (error) {
      console.warn('Failed to fetch account metadata:', error);
    }

    // Fallback to basic userinfo API
    if (!result.profile.email) {
      try {
        const basicProfile = await fetchGoogleProfile(accessToken);
        result.profile.name = basicProfile.name || null;
        result.profile.email = basicProfile.email || null;
        result.profile.picture = basicProfile.picture || null;
        result.profile.locale = basicProfile.locale || null;
        result.profile.emailVerified = basicProfile.email_verified || null;
      } catch (error) {
        console.warn('Failed to fetch basic Google profile:', error);
      }
    }

    // Fetch Gmail metadata
    try {
      const gmailMetadata = await fetchGmailComprehensiveMetadata(accessToken);
      if (gmailMetadata) {
        result.gmailMetadata = {
          totalInboxCount: gmailMetadata.totalInboxCount,
          totalSpamCount: gmailMetadata.totalSpamCount,
          totalUnreadCount: gmailMetadata.totalUnreadCount,
          uniqueSenders: gmailMetadata.uniqueSenders,
          suspiciousDomains: gmailMetadata.suspiciousDomains,
          lastMessageTimestamps: gmailMetadata.lastMessageTimestamps,
          labels: gmailMetadata.labels
        };
      }
    } catch (error) {
      console.warn('Failed to fetch Gmail metadata:', error);
    }

    // Fetch Gmail settings
    try {
      const gmailSettings = await fetchGmailSettings(accessToken);
      if (gmailSettings) {
        result.gmailSettings = {
          forwardingEnabled: gmailSettings.forwardingEnabled,
          forwardingAddress: gmailSettings.forwardingAddress || null,
          popEnabled: gmailSettings.popEnabled,
          imapEnabled: gmailSettings.imapEnabled,
          autoReplyEnabled: gmailSettings.autoReplyEnabled,
          autoReplyMessage: gmailSettings.autoReplyMessage || null,
          signature: gmailSettings.signature || null,
          delegatedAccounts: gmailSettings.delegatedAccounts
        };
      }
    } catch (error) {
      console.warn('Failed to fetch Gmail settings:', error);
    }

  } catch (error) {
    console.error('Error fetching real Google data:', error);
  }

  return result;
}


