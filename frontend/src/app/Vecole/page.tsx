"use client";

import React, { useState, useEffect, useRef } from "react";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import ProfileModal from "../components/ProfileModal";
import Dashboard from "./Dashboard";
import UserCenter from "./UserCenter";
import Grades from "./Grades";
import Bank from "./Bank";
import Item from "./Item";
import Standard from "./Standard";
import Contents from "./Contents";

type PageKey = "dashboard" | "grades" | "banks" | "items" | "standards" | "contents" | "users" | "Profile";


// componentsWithNav defined below will be used to render pages

export default function VecoleRoot() {
  const [page, setPage] = useState<PageKey>("dashboard");
  // leaveConfirmRef controls whether we should prompt before leaving
  const leaveConfirmRef = useRef(true);

  useEffect(() => {
    // beforeunload: shows confirm dialog on refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!leaveConfirmRef.current) return;
      e.preventDefault();
      // Chrome requires setting returnValue to show the prompt
      e.returnValue = '';
      return '';
    };

    // popstate: handle browser back/forward navigation
    const handlePopState = (e: PopStateEvent) => {
      if (!leaveConfirmRef.current) return;
      const leave = window.confirm('Are you sure you want to leave Vecole?');
      if (!leave) {
        // push the current state back so the user stays on the same page
        history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    // ensure there's an initial history state so popstate can be controlled
    if (!history.state) history.replaceState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
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
    Profile: <ProfileModal open={true} onClose={() => setPage("dashboard")} />
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader onNavigate={(p) => {
        if (p === "grades" || p === "banks" || p === "items" || p === "standards" || p === "contents" || p === 'users' || p === 'Profile') setPage(p as PageKey);
        else setPage("dashboard");
      }} />
      <main className="flex-1">
        {componentsWithNav[page]}
      </main>
      <AppFooter />
    </div>
  );
}
