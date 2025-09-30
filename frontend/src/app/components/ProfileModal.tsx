"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";

type Props = { open: boolean; onClose: () => void };

export default function ProfileModal({ open, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const stored = typeof window !== 'undefined' ? { username: localStorage.getItem('username'), email: localStorage.getItem('email') } : null;
    setUsername(stored?.username || "");
    setEmail(stored?.email || "");
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
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
      // update localStorage and close
      localStorage.setItem('username', updated.username);
      if (updated.profilePic) localStorage.setItem('profilePic', updated.profilePic);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-semibold mb-4">Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="text" readOnly value={email} className="w-full px-3 py-2 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
            <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-[#456CBD] text-white rounded">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
