"use client";
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { useConfirm } from '../components/ConfirmProvider';
import { useRouter } from 'next/navigation';

const AuthCard = dynamic(() => import('./AuthCard'), { ssr: false });

export default function AuthCardPage() {
  const confirm = useConfirm();
  const router = useRouter();
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

      // Immediately revert any forward/back navigation without prompting
      handlingRef.current = true;
      try {
        if (isForward) history.go(-1);
        else history.go(1);
      } catch (e) {
        try { history.pushState({ auth_seq: seqRef.current }, '', window.location.href); } catch (e) { /* ignore */ }
      } finally {
        // release the lock shortly after
        setTimeout(() => { handlingRef.current = false; }, 50);
      }
      return;
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f8fc] relative">
      {/* Page-level return button (top-left) */}
      <button
        onClick={() => router.push('/')}
        aria-label="Return to main page"
        className="absolute left-4 top-4 z-50 inline-flex items-center gap-2 px-3 py-2 bg-white shadow rounded-full text-sm text-gray-700 hover:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L6.414 9H17a1 1 0 110 2H6.414l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Home</span>
      </button>
      <AuthCard />
    </div>
  );
}
