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
  dashboard: <Dashboard />,
  grades: <Grades />,
  banks: <Bank />,
  items: <Item />,
  standards: <Standard />,
  contents: <Contents />,
};

export default function VecoleRoot() {
  const [page, setPage] = useState<PageKey>("dashboard");
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader onNavigate={(p) => {
        if (p === "grades" || p === "banks" || p === "items" || p === "standards" || p === "contents") setPage(p);
        else setPage("dashboard");
      }} />
      <main className="flex-1">
        {COMPONENTS[page]}
      </main>
      <AppFooter />
    </div>
  );
}
