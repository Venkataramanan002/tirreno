import { supabase } from "@/integrations/supabase/client";

export interface OAuthIdentity {
  email: string | null;
  name: string | null;
  picture: string | null;
  provider: string;
  provider_sub: string;
}

export const oauthService = {
  async listIdentities(): Promise<OAuthIdentity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('oauth_users')
      .select('email,name,picture,provider,provider_sub')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) return [];
    return (data || []) as OAuthIdentity[];
  },

  async switchToGoogle(email: string): Promise<void> {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/oauth/callback`,
        scopes: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly',
        queryParams: { login_hint: email, prompt: 'consent' }
      }
    });
  }
  ,
  async verifyCurrentAccount(): Promise<Record<string, any>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { authenticated: false };
    const emailCandidate = user.email || (() => {
      try {
        const raw = localStorage.getItem('oauth_profile');
        if (raw) return (JSON.parse(raw).email as string | undefined) || undefined;
      } catch {}
      return undefined;
    })() || undefined;

    const results: Record<string, any> = { authenticated: true, userId: user.id };

    const { data: profileByUserId } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    results.profileByUserId = profileByUserId || null;

    if (emailCandidate) {
      const { data: profilesByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', emailCandidate);
      results.profilesByEmail = profilesByEmail || [];
    }

    const googleSub = user.identities?.[0]?.identity_data?.sub as string | undefined;
    const providerSub = emailCandidate || googleSub || user.id;

    const { data: oauthByUserId } = await supabase
      .from('oauth_users')
      .select('*')
      .eq('user_id', user.id);
    results.oauthByUserId = oauthByUserId || [];

    if (emailCandidate) {
      const { data: oauthByEmail } = await supabase
        .from('oauth_users')
        .select('*')
        .eq('email', emailCandidate);
      results.oauthByEmail = oauthByEmail || [];
    }

    const { data: oauthByProviderSub } = await supabase
      .from('oauth_users')
      .select('*')
      .eq('provider', 'google')
      .eq('provider_sub', providerSub);
    results.oauthByProviderSub = oauthByProviderSub || [];

    if ((!results.oauthByUserId || results.oauthByUserId.length === 0) && emailCandidate) {
      await supabase
        .from('oauth_users')
        .upsert({
          user_id: user.id,
          email: emailCandidate,
          provider: 'google',
          provider_sub: providerSub
        }, { onConflict: 'provider,provider_sub' });
      const { data: postUpsert } = await supabase
        .from('oauth_users')
        .select('*')
        .eq('user_id', user.id);
      results.oauthByUserIdAfterUpsert = postUpsert || [];
    }

    return results;
  }
};
