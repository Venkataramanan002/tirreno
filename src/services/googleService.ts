export interface GoogleProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface GmailMessageMeta {
  id: string;
  threadId: string;
  snippet?: string;
  payloadHeaders?: Array<{ name: string; value: string }>;
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
      payloadHeaders: data?.payload?.headers || []
    });
  }
  return results;
}


