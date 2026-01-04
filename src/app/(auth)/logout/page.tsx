'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Redirect to login
      window.location.href = '/login';
    };

    signOut();
  }, [router]);

  return (
    <div className="min-h-screen bg-theme-primary flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold text-theme-primary mb-4">Signing out...</div>
        <div className="text-theme-muted">Please wait</div>
      </div>
    </div>
  );
}

