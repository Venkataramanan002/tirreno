import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchGoogleProfile, fetchGmailMetadata, fetchGmailMessages } from "@/services/googleService";
import { mobileVerificationService } from "@/services/mobileVerificationService";

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      try {
        // Supabase handles token parsing from URL when detectSessionInUrl is true.
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.provider_token as string | undefined;

        if (!accessToken) {
          navigate("/");
          return;
        }

        // Fetch Google profile and Gmail data
        let profileName = "unable to fetch data";
        let profileEmail = "unable to fetch data";
        let profilePicture = "";
        let profilePhone = "";
        try {
          const gp = await fetchGoogleProfile(accessToken);
          profileName = gp.name || profileName;
          profileEmail = gp.email || profileEmail;
          profilePicture = gp.picture || profilePicture;
          
          // Try to extract phone number from Google profile
          const extractedPhone = mobileVerificationService.extractPhoneFromGoogleProfile(gp);
          if (extractedPhone) {
            profilePhone = extractedPhone;
            console.log('📱 Phone number extracted from Google profile:', profilePhone);
          }
        } catch {}

        let gmailMessageIds: string[] = [];
        try {
          gmailMessageIds = await fetchGmailMetadata(accessToken, 10);
        } catch {}

        try {
          const msgs = await fetchGmailMessages(accessToken, gmailMessageIds.slice(0, 5));
          localStorage.setItem('gmail_messages', JSON.stringify(msgs));
        } catch {}

        // Persist compact profile locally for UI replacement
        localStorage.setItem('oauth_profile', JSON.stringify({
          name: profileName,
          email: profileEmail,
          picture: profilePicture,
          phone: profilePhone
        }));

        // If phone number was extracted, validate it and store verification data
        if (profilePhone) {
          try {
            const phoneValidation = await mobileVerificationService.validatePhoneNumber(profilePhone);
            if (phoneValidation.isValid) {
              localStorage.setItem('verifiedPhoneNumber', profilePhone);
              localStorage.setItem('phoneVerificationData', JSON.stringify(phoneValidation));
              console.log('✅ Phone number from Google profile validated:', phoneValidation);
            }
          } catch (error) {
            console.warn('⚠️ Failed to validate phone number from Google profile:', error);
          }
        }

        // Upsert into Supabase oauth_users
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


