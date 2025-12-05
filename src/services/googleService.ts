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


