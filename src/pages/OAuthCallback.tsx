import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchGoogleProfile, fetchGmailMetadata, fetchGmailMessages } from "@/services/googleService";

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.provider_token as string | undefined;

        if (!accessToken) {
          navigate("/");
          return;
        }

        let profileName = "unable to fetch data";
        let profileEmail = "unable to fetch data";
        let profilePicture = "";
        try {
          const gp = await fetchGoogleProfile(accessToken);
          profileName = gp.name || profileName;
          profileEmail = gp.email || profileEmail;
          profilePicture = gp.picture || profilePicture;
        } catch {}

        let gmailMessageIds: string[] = [];
        try {
          gmailMessageIds = await fetchGmailMetadata(accessToken, 10);
        } catch {}

        try {
          const msgs = await fetchGmailMessages(accessToken, gmailMessageIds.slice(0, 5));
          localStorage.setItem('gmail_messages', JSON.stringify(msgs));
        } catch {}

        localStorage.setItem('oauth_profile', JSON.stringify({
          name: profileName,
          email: profileEmail,
          picture: profilePicture
        }));

        const user = sessionData.session?.user;
        if (user) {
          await supabase.from('oauth_users').upsert({
            user_id: user.id,
            email: profileEmail !== 'unable to fetch data' ? profileEmail : null,
            name: profileName !== 'unable to fetch data' ? profileName : null,
            picture: profilePicture || null,
            provider: 'google',
            provider_sub: user.identities?.[0]?.identity_data?.sub || user.id
          }, { onConflict: 'provider,provider_sub' });
        }

        navigate("/");
      } catch {
        navigate("/");
      }
    };
    handle();
  }, [navigate]);

  return null;
};

export default OAuthCallback;
