import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchRealGoogleData, fetchGmailMetadata, fetchGmailMessages } from "@/services/googleService";

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.provider_token as string | undefined;

        if (!accessToken) {
          navigate("/dashboard");
          return;
        }

        // Fetch all real Google data using unified function
        let googleData = null;
        try {
          googleData = await fetchRealGoogleData(accessToken);
        } catch (error) {
          console.warn('Failed to fetch real Google data:', error);
        }

        // Fallback values
        let profileName = googleData?.profile?.name || "unable to fetch data";
        let profileEmail = googleData?.profile?.email || "unable to fetch data";
        let profilePicture = googleData?.profile?.picture || "";
        let locale = googleData?.profile?.locale || null;
        let emailVerified = googleData?.profile?.emailVerified || null;

        // Store comprehensive Google data
        localStorage.setItem('oauth_profile', JSON.stringify({
          name: profileName,
          email: profileEmail,
          picture: profilePicture,
          locale: locale,
          emailVerified: emailVerified
        }));

        // Store Gmail metadata
        if (googleData?.gmailMetadata) {
          localStorage.setItem('gmail_metadata', JSON.stringify(googleData.gmailMetadata));
        }

        // Store Gmail settings
        if (googleData?.gmailSettings) {
          localStorage.setItem('gmail_settings', JSON.stringify(googleData.gmailSettings));
        }

        // Store full Google data for components
        localStorage.setItem('google_real_data', JSON.stringify(googleData));

        // Also fetch message IDs for backward compatibility
        let gmailMessageIds: string[] = [];
        try {
          gmailMessageIds = await fetchGmailMetadata(accessToken, 10);
        } catch {}

        try {
          const msgs = await fetchGmailMessages(accessToken, gmailMessageIds.slice(0, 5));
          localStorage.setItem('gmail_messages', JSON.stringify(msgs));
        } catch {}

        const user = sessionData.session?.user;
        if (user) {
          const googleSub = user.identities?.[0]?.identity_data?.sub as string | undefined;
          const providerSub = (profileEmail && profileEmail !== 'unable to fetch data') ? profileEmail : (googleSub || user.id);
          await supabase.from('oauth_users').upsert({
            user_id: user.id,
            email: profileEmail !== 'unable to fetch data' ? profileEmail : null,
            name: profileName !== 'unable to fetch data' ? profileName : null,
            picture: profilePicture || null,
            provider: 'google',
            provider_sub: providerSub
          }, { onConflict: 'provider,provider_sub' });
        }

        navigate("/dashboard");
      } catch {
        navigate("/dashboard");
      }
    };
    handle();
  }, [navigate]);

  return null;
};

export default OAuthCallback;
