"use client";
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const AuthCard = dynamic(() => import('./AuthCard'), { ssr: false });

export default function AuthCardPage() {
  useEffect(() => {
    // Block forward navigation by inserting a same-URL history entry when
    // landing on AuthCard. This makes the browser Forward button land on
    // the same page instead of going to the previous Vecole page.
    try {
      const pushed = sessionStorage.getItem('auth_forward_guard') === '1';
      if (!pushed) {
        history.pushState({ __auth_forward_guard: true }, '', window.location.href);
        try { sessionStorage.setItem('auth_forward_guard', '1'); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // ignore history/session errors
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f8fc]">
      <AuthCard />
    </div>
  );
}
