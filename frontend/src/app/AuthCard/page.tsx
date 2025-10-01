"use client";
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { useConfirm } from '../components/ConfirmProvider';

const AuthCard = dynamic(() => import('./AuthCard'), { ssr: false });

export default function AuthCardPage() {
  const confirm = useConfirm();
  const seqRef = useRef<number | null>(null);
  const handlingRef = useRef(false);

  useEffect(() => {
    // initialize a guarded history sequence so we can detect forward/back
    try {
      const base = Date.now();
      history.replaceState({ auth_seq: base }, '', window.location.href);
      history.pushState({ auth_seq: base + 1 }, '', window.location.href);
      seqRef.current = base + 1;
      try { sessionStorage.setItem('auth_forward_guard', '1'); } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore
    }

    const onPop = (ev: PopStateEvent) => {
      if (handlingRef.current) {
        handlingRef.current = false;
        return;
      }
      const incoming = (ev.state && (ev.state as any).auth_seq) ?? null;
      const current = seqRef.current ?? 0;
      const isForward = incoming != null ? incoming > current : true;

      (async () => {
        let ok = false;
        try {
          ok = await confirm({ title: 'Leave Auth', description: 'Do you want to leave this page?' });
        } catch (e) {
          // fallback to native confirm if modal unavailable
          ok = window.confirm('Do you want to leave this page?');
        }

        if (!ok) {
          handlingRef.current = true;
          try {
            if (isForward) history.go(-1);
            else history.go(1);
          } catch (e) {
            try { history.pushState({ auth_seq: seqRef.current }, '', window.location.href); } catch (e) { /* ignore */ }
          }
        } else {
          // allow navigation: update current seq
          if (incoming != null) seqRef.current = incoming;
        }
      })();
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f8fc]">
      <AuthCard />
    </div>
  );
}
