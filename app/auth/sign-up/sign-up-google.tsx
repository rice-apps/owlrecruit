'use client';
import { useState } from 'react';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function GoogleAuthSetup() {
    
    useEffect(() => {
    //     declare global {
    //         interface Window {
    //             handleSignInWithGoogle: (response: { credential: any }) => Promise<void>;
    //   }
    // }
    (window as any).handleSignInWithGoogle = async function (response: { credential: any }) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
    })
};
}, []);

    return null;
}
    
