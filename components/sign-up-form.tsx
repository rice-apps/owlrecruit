"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Script from "next/script";
import GoogleAuthSetup from "@/app/auth/sign-up/sign-up-google";


export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // useEffect(() => {
  //       const script = document.createElement('script');
  //       script.src = 'https://accounts.google.com/gsi/client';
  //       script.async = true;
  //       script.defer = true;
  //       script.onload = () => setLoaded(true);
  // })
  // if (!loaded) return null;
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <GoogleAuthSetup />
      {/* <Script id="handleSignInWithGoogle">{`
          
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.credential,
  })
      `}</Script> */}
      <script src="https://accounts.google.com/gsi/client" async />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
