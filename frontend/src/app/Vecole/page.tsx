"use client";

import React, { useState, useEffect, useRef } from "react";
import { useConfirm } from "../components/ConfirmProvider";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import Dashboard from "./Dashboard";
import UserCenter from "./UserCenter";
import Grades from "./Grades";
import Bank from "./Bank";
import Item from "./Item";
import Standard from "./Standard";
import Contents from "./Contents";
import ProfileModal from "../components/ProfileModal";

type PageKey = "dashboard" | "grades" | "banks" | "items" | "standards" | "contents" | "users";


// componentsWithNav defined below will be used to render pages

export default function VecoleRoot() {
  const [page, setPage] = useState<PageKey>("dashboard");
  // leaveConfirmRef controls whether we should prompt before leaving
  const leaveConfirmRef = useRef(true);
  const confirm = useConfirm();

  useEffect(() => {
    // Capture confirm once so this effect doesn't re-run when ConfirmProvider re-renders
    const localConfirm = confirm;
    const handlingRef = { current: false } as { current: boolean };

    // record the entry referrer and whether there was prior history when we opened Vecole
    try {
      const ref = document.referrer || '';
      sessionStorage.setItem('vecole_entry_referrer', ref);
      sessionStorage.setItem('vecole_entry_history', String(history.length || 0));
    } catch (e) { /* ignore */ }

    // If running in Chrome, skip the popstate interception because Chrome's
    // navigation semantics here can cause reload loops. Instead we rely on
    // the in-app "Leave Vecole" button as a deterministic fallback.
    const isChrome = typeof navigator !== 'undefined' && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    // popstate: handle browser back/forward navigation (leaving confirmation)
      const handlePopState = (e: PopStateEvent) => {
        if (!leaveConfirmRef.current) return;
        if (handlingRef.current) return; // avoid re-entrancy
        handlingRef.current = true;
      // debug log to help diagnose Chrome behavior
      try {
        // eslint-disable-next-line no-console
        console.debug('[Vecole] popstate handler', {
          href: window.location.href,
          referrer: document.referrer,
          sessionReferrer: sessionStorage.getItem('vecole_entry_referrer'),
          historyLength: history.length,
          historyState: history.state,
          leaveConfirmRef: leaveConfirmRef.current,
        });
      } catch (e) { /* ignore */ }
      // prevent navigation by restoring the current state
      try { history.pushState(null, '', window.location.href); } catch (e) { /* ignore */ }
      // show our async modal confirmation. If the user confirms, allow the navigation
      (async () => {
        try {
          const ok = await localConfirm({ title: 'Leave Vecole', description: 'Are you sure you want to leave Vecole?' });
          if (ok) {
            // allow future popstate to proceed
            leaveConfirmRef.current = false;
            // prefer the session-stored referrer if present and different
            try {
              const sref = sessionStorage.getItem('vecole_entry_referrer');
              if (sref && sref !== '' && sref !== window.location.href) {
                // navigate to the stored referrer
                window.location.href = sref;
                return;
              }
            } catch (e) { /* ignore */ }

            // otherwise, if there is a history entry, go back; else go to root
            try {
              if (history.length > 1) {
                history.back();
              } else {
                window.location.href = '/';
              }
            } catch (e) {
              try { window.location.href = '/'; } catch (e) { /* ignore */ }
            }
          }
        } catch (err) {
          // ignore
        } finally {
          handlingRef.current = false;
        }
      })();
    };

    window.addEventListener('popstate', handlePopState);
    // push a single guarded history state once per session so Back hits a state we control
    try {
      const alreadyPushed = sessionStorage.getItem('vecole_guard_pushed') === '1';
      const currentStateHasGuard = history.state && (history.state as any).__vecole_guard;
      if (!currentStateHasGuard && !alreadyPushed) {
        history.pushState({ __vecole_guard: true }, '', window.location.href);
        try { sessionStorage.setItem('vecole_guard_pushed', '1'); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // ignore (some environments may restrict pushState)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Pass setPage as onNavigate to Dashboard
  const componentsWithNav: Record<PageKey, React.ReactNode> = {
  dashboard: <Dashboard onNavigate={(p) => setPage(p as PageKey)} leaveConfirmRef={leaveConfirmRef} />,
    grades: <Grades />,
    banks: <Bank />,
    items: <Item />,
    standards: <Standard />,
    contents: <Contents />,
    users: <UserCenter />,
  };
  const [isProfileOpen, setProfileOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader onNavigate={(p) => {
        if (p === "grades" || p === "banks" || p === "items" || p === "standards" || p === "contents" || p === 'users') setPage(p as PageKey);
        else setPage("dashboard");
      }} onOpenProfile={() => setProfileOpen(true)} />
      
      <main className="flex-1">
        {componentsWithNav[page]}
      </main>
      <AppFooter />
      <ProfileModal open={isProfileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
