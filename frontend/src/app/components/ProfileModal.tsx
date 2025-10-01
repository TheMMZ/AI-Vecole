"use client";

import { useState, useEffect } from "react";
import { useConfirm } from "./ConfirmProvider";
import { apiFetch, apiBase } from "../../lib/api";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";

type Props = { open: boolean; onClose: () => void };

export default function ProfileModal({ open, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    if (!open) return;
    const stored = typeof window !== 'undefined' ? { username: localStorage.getItem('username'), email: localStorage.getItem('email'), profilePic: localStorage.getItem('profilePic') } : null;
    setUsername(stored?.username || "");
    setEmail(stored?.email || "");
    setPreviewUrl(stored?.profilePic || null);
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setError(null);
    setFile(f);
    // show local preview
    try { if (previewUrl) URL.revokeObjectURL(previewUrl); } catch(e){}
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      if (!userId) throw new Error('Not logged in');

      const updates: any = { username };
      if (password) updates.password = password;

      // If file provided, upload to storj using presigned URL for Profils/<userId>
      if (file) {
        const presignRes = await apiFetch('/api/content/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/png', folder: 'Profils', userId }),
        });
        if (!presignRes.ok) {
          const body = await presignRes.json().catch(() => ({}));
          throw new Error(body.error || 'Could not get upload URL');
        }
        const presign = await presignRes.json();
        const uploadRes = await fetch(presign.url, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/png' }, body: file });
        if (!uploadRes.ok) throw new Error('Upload failed');
        // Update profilePic to /storj/<key>
        updates.profilePic = `/storj/${presign.key}`;
      }

      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update profile');
      }
      const updated = await res.json();
  // update localStorage and close, then refresh so header updates
  localStorage.setItem('username', updated.username);
  if (updated.profilePic) localStorage.setItem('profilePic', updated.profilePic);
  onClose();
  try { window.location.reload(); } catch (e) { /* ignore */ }
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="fixed z-50 inset-0 overflow-y-auto flex items-center justify-center min-h-screen px-4 bg-black bg-opacity-30">
  <Dialog.Panel className="bg-white rounded-xl shadow-xl p-8 max-w-xl w-full">
          <Dialog.Title className="text-xl font-bold text-gray-800 mb-6">Edit Profile</Dialog.Title>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input 
                id="email"
                type="text" 
                readOnly 
                value={email} 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-gray-900 bg-gray-100 cursor-not-allowed" 
              />
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input 
                id="username"
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-gray-900 placeholder-gray-500" 
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-gray-900 placeholder-gray-500" 
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image
              </label>
              <input 
                id="profileImage"
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#456CBD] file:text-white hover:file:bg-[#3a5ba0]"
              />
              {previewUrl && (
                <div className="mt-2">
                  <img src={previewUrl && previewUrl.startsWith('/storj/') ? `${apiBase()}${previewUrl}` : (previewUrl.startsWith('/') ? `${location.origin}${previewUrl}` : previewUrl)} alt="preview" className="w-40 h-40 object-cover rounded" />
                </div>
              )}
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={onClose} 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                {/* Remove picture button when a profile exists */}
                {previewUrl && (
                  <button
                    onClick={async () => {
                      let ok = false;
                      try {
                        ok = await confirm({ title: 'Remove profile picture', description: 'Are you sure you want to remove your profile picture?' });
                      } catch (e) {
                        ok = window.confirm('Remove profile picture?');
                      }
                      if (!ok) return;
                      setIsLoading(true);
                      try {
                        const userId = localStorage.getItem('userId');
                        if (!userId) throw new Error('Not logged in');
                        const res = await apiFetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profilePic: null }) });
                        if (!res.ok) {
                          const body = await res.json().catch(() => ({}));
                          throw new Error(body.error || `Failed to remove profile picture (status ${res.status})`);
                        }
                        localStorage.removeItem('profilePic');
                        setPreviewUrl(null);
                        onClose();
                        try { window.location.reload(); } catch (e) { }
                      } catch (e: any) {
                        setError(String(e?.message || 'Failed to remove'));
                        // also log to console for deployed debugging
                        try { console.error('Remove profile pic error:', e); } catch (e) {}
                      } finally { setIsLoading(false); }
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Remove Picture
                  </button>
                )}

                <button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#456CBD] text-white rounded-lg hover:bg-[#3a5ba0] transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}