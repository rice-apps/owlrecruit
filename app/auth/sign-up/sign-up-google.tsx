"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Script from 'next/script'

const supabase = createClient(
    // TODO: add error handling if keys are missing
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
declare global {
  interface Window {
    handleSignInWithGoogle: (response: { credential: string }) => Promise<void>;
  }
}

export default function SignUpGoogleBtn() {
    const handleSignInWithGoogle = useCallback(async (response: { credential: string }) => {
    try {
        const { data, error } = await supabase.auth.signInWithIdToken({
            // problem with data handling after sign in,
            // test w/ actual supabase instance or reinstall supabase image to account for new changes
            provider: 'google',
            token: response.credential,
            });
            if (error) console.error(error.message);
        } catch (err) { console.error(err)}}, [])
    
    useEffect(() => {
        window.handleSignInWithGoogle = handleSignInWithGoogle;
    }, [handleSignInWithGoogle]);

    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            <div id="g_id_onload"
              data-client_id="411999379081-n4h1dh8au1a7a861a13o00irbje4mjp6.apps.googleusercontent.com"
              data-context="signup"
              data-ux_mode="popup"
              data-callback="handleSignInWithGoogle"
              data-auto_prompt="false">
            </div>

            <div className="g_id_signin"
                data-type="standard"
                data-shape="pill"
                data-theme="filled_blue"
                data-text="signin_with"
                data-size="large"
                data-logo_alignment="left">
            </div>
          </>
    )
}
