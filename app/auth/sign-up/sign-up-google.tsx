"use client";
import { useCallback, useEffect, useState } from "react";
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
  const [authError, setAuthError] = useState<boolean>(false);

    const handleSignInWithGoogle = useCallback(async (response: { credential: string }) => {
      const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            });

            if (error) {
          setAuthError(true);
      console.error('Sign in error:', error);
      return;
    }

            if (data?.user) {
              router.push('/protected/discover');
            }
          }, [router]);
    
    useEffect(() => {
        window.handleSignInWithGoogle = handleSignInWithGoogle;
    }, [handleSignInWithGoogle]);

    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            <div id="g_id_onload"
              data-client_id={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID}
              data-context="signup"
              data-ux_mode="popup"
              data-callback="handleSignInWithGoogle"
              data-auto_prompt="false"
              data-hosted_domain="rice.edu">
              
            </div>

            <div className="g_id_signin"
                data-type="standard"
                data-shape="rectangular"
                data-theme="filled_white"
                data-text="continue_with"
                data-size="large"
                data-logo_alignment="left">
            </div>

            {/* Error Modal */}
      {authError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setAuthError(false)}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl mx-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Failed to Sign Up</h2>
                <p className="mt-1 text-sm text-gray-600">
                  OwlRecruit requires the use of your Rice email to sign up. Please use your Rice email to sign up for an account.
                </p>
              </div>
            </div>
            {/* Close Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setAuthError(false)}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
