"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal, Text, Button, Stack } from "@mantine/core";
import { createClient } from "@/lib/supabase/client";
import Script from "next/script";
import { useRouter } from "next/navigation";

const supabase = createClient();

declare global {
  interface Window {
    handleSignInWithGoogle: (response: { credential: string }) => Promise<void>;
  }
}

export default function SignUpGoogleBtn() {
  const router = useRouter();
  const [authError, setAuthError] = useState(false);

  const handleSignInWithGoogle = useCallback(
    async (response: { credential: string }) => {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });

      if (error) {
        setAuthError(true);
        return;
      }

      if (data?.user) {
        router.push("/protected/discover");
      }
    },
    [router],
  );

  useEffect(() => {
    window.handleSignInWithGoogle = handleSignInWithGoogle;
  }, [handleSignInWithGoogle]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <div
        id="g_id_onload"
        data-client_id={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID}
        data-context="signup"
        data-ux_mode="popup"
        data-callback="handleSignInWithGoogle"
        data-auto_prompt="false"
        data-hosted_domain="rice.edu"
      />
      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="filled_white"
        data-text="continue_with"
        data-size="large"
        data-logo_alignment="left"
      />

      <Modal
        opened={authError}
        onClose={() => setAuthError(false)}
        title="Sign-in failed"
        size="sm"
      >
        <Stack>
          <Text size="sm">
            OwlRecruit requires a Rice University email address. Please sign in
            with your <strong>@rice.edu</strong> account.
          </Text>
          <Button onClick={() => setAuthError(false)} fullWidth>
            Close
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
