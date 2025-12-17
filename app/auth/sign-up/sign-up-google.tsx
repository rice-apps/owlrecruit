"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
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
  const handleSignInWithGoogle = useCallback(
    async (response: { credential: string }) => {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });
      if (data?.user) {
        router.push("/protected");
      }
    },
    [],
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
        data-client_id="530339823745-p2p8i1r4e6ki8f1ra93aar28n5pil04f.apps.googleusercontent.com"
        data-context="signup"
        data-ux_mode="popup"
        data-callback="handleSignInWithGoogle"
        data-auto_prompt="false"
      ></div>

      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="filled_white"
        data-text="continue_with"
        data-size="large"
        data-logo_alignment="left"
      ></div>
    </>
  );
}
