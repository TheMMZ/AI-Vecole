"use client";

import { useEffect, useState } from "react";

type PageKey = "home" | "Vecole" | "grades" | "items" | "banks" | "standards" | "contents";
type AppHeaderProps = {
  onNavigate?: (page: PageKey) => void;
};

const navLinks: { name: string; page: PageKey }[] = [
  { name: "Banks", page: "banks" },
  { name: "Items", page: "items" },
  { name: "Grades", page: "grades" },
  { name: "Standards", page: "standards" },
  { name: "Contents", page: "contents" },
];

export default function AppHeader({ onNavigate }: AppHeaderProps) {
  const [username, setUsername] = useState<string | null>(null);
  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  return (
    <header className="w-full h-24 bg-white shadow flex items-center justify-between px-8 py-4 rounded-bl-2xl rounded-br-2xl mb-8">
      <button
        type="button"
        className="flex items-center gap-2 group bg-transparent border-none outline-none"
        title="Home"
        onClick={() => onNavigate && onNavigate("Vecole")}
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <svg width="110" height="32" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 18L24 28L36 8" stroke="#22c55e" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="40" y="25" fontFamily="'Segoe UI', Arial, sans-serif" fontSize="24" fill="#456CBD" fontWeight="bold" style={{fontWeight:700}}>ecole</text>
        </svg>
      </button>
      <nav className="flex-1 flex justify-center">
        <ul className="flex gap-6">
          {navLinks.map(link => (
            <li key={link.name}>
              <button
                type="button"
                className="text-base font-bold text-gray-700 hover:text-primary transition-colors bg-transparent border-none outline-none"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => onNavigate && onNavigate(link.page)}
              >
                {link.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#456CBD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" />
        </svg>
        <span className="font-semibold text-gray-700">{username}</span>
        <button
          onClick={handleLogout}
          className="ml-2 px-3 py-1 rounded bg-primary text-white font-semibold hover:bg-secondary transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
