"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "./ConfirmProvider";
import { apiBase } from "../../lib/api";

type PageKey = "home" | "Vecole" | "grades" | "items" | "banks" | "standards" | "contents" | "users";
type AppHeaderProps = {
  onNavigate?: (page: PageKey) => void;
  onOpenProfile?: () => void;
};

const navLinks: { name: string; page: PageKey }[] = [
  { name: "Banks", page: "banks" },
  { name: "Items", page: "items" },
  { name: "Grades", page: "grades" },
  { name: "Standards", page: "standards" },
  { name: "Contents", page: "contents" },
];

function initials(name: string | null | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AppHeader({ onNavigate, onOpenProfile }: AppHeaderProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setUsername(localStorage.getItem("username"));
    setIsAdmin(localStorage.getItem('role') === 'admin');
    setProfilePic(localStorage.getItem('profilePic'));

    const handleFocus = () => {
      setUsername(localStorage.getItem("username"));
      setIsAdmin(localStorage.getItem('role') === 'admin');
      setProfilePic(localStorage.getItem('profilePic'));
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const confirm = typeof window !== 'undefined' ? useConfirm() : null;
  const handleLogout = async () => {
    try {
      const ok = await (confirm ? confirm({ title: 'Logout', description: 'Are you sure you want to log out?' }) : Promise.resolve(window.confirm('Are you sure you want to log out?')));
      if (!ok) return;
      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      // no-op
    }
  };

  return (
  <header className="w-full h-24 bg-white shadow flex items-center justify-between px-4 sm:px-8 py-4 rounded-bl-2xl rounded-br-2xl mb-8 relative">
      {/* Mobile menu toggle (left on small screens) */}
      <div className="sm:hidden flex items-center">
        <button
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
          className="p-2 rounded-md border border-gray-200 bg-white mr-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 group bg-transparent border-none outline-none absolute left-1/2 transform -translate-x-1/2 sm:static sm:transform-none z-40"
        title="Home"
        onClick={() => onNavigate && onNavigate("Vecole")}
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <svg width="110" height="32" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 sm:w-auto">
          <path d="M18 18L24 28L36 8" stroke="#22c55e" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="40" y="25" fontFamily="'Segoe UI', Arial, sans-serif" fontSize="24" fill="#456CBD" fontWeight="bold" style={{fontWeight:700}}>ecole</text>
        </svg>
      </button>
      <nav className="flex-1 flex justify-center">
        {/* Desktop nav */}
        <ul className="hidden sm:flex gap-6">
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
          {isAdmin ? (
            <li>
              <button
                type="button"
                className="text-base font-bold text-gray-700 hover:text-primary transition-colors bg-transparent border-none outline-none"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => onNavigate && onNavigate('users')}
              >
                Users
              </button>
            </li>
          ) : null}
        </ul>

        {/* mobile toggle moved outside to left of logo */}
        {mobileOpen && (
          <div className="sm:hidden absolute top-20 left-2 right-2 bg-white rounded-lg shadow-lg p-4 z-50">
            <ul className="flex flex-col gap-3">
                {navLinks.map(link => (
                  <li key={link.name}>
                    <button className="w-full text-left text-base font-bold text-gray-700" onClick={() => { setMobileOpen(false); onNavigate && onNavigate(link.page); }}>{link.name}</button>
                  </li>
                ))}
                {isAdmin && (
                  <li>
                    <button className="w-full text-left text-base font-bold text-gray-700" onClick={() => { setMobileOpen(false); onNavigate && onNavigate('users'); }}>Users</button>
                  </li>
                )}
                <li>
                  <button className="w-full text-left text-base font-bold text-gray-700" onClick={() => { setMobileOpen(false); onOpenProfile && onOpenProfile(); }}>Profile</button>
                </li>
                <li>
                  <button className="w-full text-left text-base font-bold text-red-600" onClick={async () => { setMobileOpen(false); const ok = confirm ? await confirm({ title: 'Logout', description: 'Are you sure you want to log out?' }) : window.confirm('Are you sure you want to log out?'); if (ok) { localStorage.clear(); window.location.href = '/'; } }}>Logout</button>
                </li>
            </ul>
          </div>
        )}
      </nav>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center sm:items-start">
          <div
            className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer"
            onClick={() => onOpenProfile && onOpenProfile()}
          >
            {profilePic ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePic.startsWith('/storj/') ? apiBase() + profilePic : profilePic} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-gray-500">{initials(username)}</span>
            )}
          </div>
          <div className="sm:hidden text-sm font-semibold mt-2">{username}</div>
        </div>

        {/* username + logout on desktop */}
        <div className="hidden sm:flex flex-col text-right">
          <div className="text-sm font-bold text-gray-700">{username}</div>
          <button
            type="button"
            className="text-xs text-red-500 hover:underline mt-0.5"
            onClick={async () => {
              const ok = confirm ? await confirm({ title: 'Logout', description: 'Are you sure you want to logout?' }) : window.confirm('Are you sure you want to logout?');
              if (ok) {
                localStorage.clear();
                window.location.href = '/';
              }
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
