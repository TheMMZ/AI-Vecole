"use client";

import React, { useState } from "react";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import Dashboard from "./Dashboard";
import Grades from "./Grades";
import Bank from "./Bank";
import Item from "./Item";
import Standard from "./Standard";
import Contents from "./Contents";

type PageKey = "dashboard" | "grades" | "banks" | "items" | "standards" | "contents";


const COMPONENTS: Record<PageKey, React.ReactNode> = {
  dashboard: undefined, // will be set below
  grades: <Grades />,
  banks: <Bank />,
  items: <Item />,
  standards: <Standard />,
  contents: <Contents />,
};

export default function VecoleRoot() {
  const [page, setPage] = useState<PageKey>("dashboard");
  // Pass setPage as onNavigate to Dashboard
  const componentsWithNav: Record<PageKey, React.ReactNode> = {
  dashboard: <Dashboard onNavigate={(p) => setPage(p as PageKey)} />,
    grades: <Grades />,
    banks: <Bank />,
    items: <Item />,
    standards: <Standard />,
    contents: <Contents />,
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader onNavigate={(p) => {
        if (p === "grades" || p === "banks" || p === "items" || p === "standards" || p === "contents") setPage(p);
        else setPage("dashboard");
      }} />
      <main className="flex-1">
        {componentsWithNav[page]}
      </main>
      <AppFooter />
    </div>
  );
}
