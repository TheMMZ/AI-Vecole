"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch, userQuery } from '../../lib/api';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';

type User = {
  _id: string;
  username?: string;
  email: string;
  role: string;
  avatarUrl?: string;
  suspended?: boolean;
  suspendedUntil?: string | Date | null;
};

const defaultForm = { email: '', username: '', password: '', role: 'teacher' };

export default function UserCenter() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [suspendDays, setSuspendDays] = useState<string>('');
  const [suspendPermanent, setSuspendPermanent] = useState(false);
  const [suspendStatus, setSuspendStatus] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/users');
      if (!res.ok) {
        let msg: string;
        try {
          const txt = await res.text();
          msg = txt || `Server returned ${res.status}`;
        } catch (e) {
          msg = `Server returned ${res.status}`;
        }
        setError(msg);
        setUsers([]);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        setError('Unexpected response shape from /api/users');
        setUsers([]);
        return;
      }
      setUsers(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        // update
        const payload: any = { username: form.username, role: form.role };
        if (form.password) payload.password = form.password;
        {
          const res = await apiFetch(`/api/users/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error((await res.text()) || `Update failed: ${res.status}`);
        }
        setEditingId(null);
      } else {
        // create
        {
          const res = await apiFetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
          if (!res.ok) throw new Error((await res.text()) || `Create failed: ${res.status}`);
        }
      }
      setForm(defaultForm);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to save user');
    }
  }

  function startEdit(u: User) {
    setEditingId(u._id);
    const displayName = u.username || '';
    setForm({ email: u.email, username: displayName, password: '', role: u.role });
  }

  // Open suspend dialog to choose duration (days) or make permanent.
  function openSuspendDialog(u: User) {
    // Open dialog (require explicit Unsuspend action inside dialog)
    setSuspendTarget(u);
    setSuspendDays('');
    setSuspendPermanent(false);
    setShowSuspendDialog(true);
    setSuspendStatus(null);
  }

  async function unsuspendUser(u: User) {
    try {
      const res = await apiFetch(`/api/users/${u._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suspended: false, suspendedUntil: null }) });
      if (!res.ok) throw new Error((await res.text()) || `Failed to unsuspend: ${res.status}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to unsuspend user');
    }
  }

  async function handleConfirmSuspend() {
    if (!suspendTarget) return;
    try {
      let suspendedUntil: string | null = null;
      if (!suspendPermanent) {
        const daysNum = parseInt(suspendDays || '0', 10);
        if (isNaN(daysNum) || daysNum <= 0) {
          setError('Please enter a valid number of days or choose Permanent');
          setSuspendStatus({ message: 'Please enter a valid number of days or choose Permanent', isError: true });
          return;
        }
        suspendedUntil = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000).toISOString();
      }
      const res = await apiFetch(`/api/users/${suspendTarget._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suspended: true, suspendedUntil }) });
      if (!res.ok) {
        const txt = await res.text();
        setSuspendStatus({ message: txt || `Failed to suspend: ${res.status}`, isError: true });
      } else {
        setSuspendStatus({ message: 'User suspended successfully', isError: false });
        await fetchUsers();
      }
    } catch (err: any) {
      setSuspendStatus({ message: err?.message || 'Failed to suspend user', isError: true });
    }
  }

  async function handleUnsuspendFromDialog() {
    if (!suspendTarget) return;
    try {
      const res = await apiFetch(`/api/users/${suspendTarget._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suspended: false, suspendedUntil: null }) });
      if (!res.ok) {
        const txt = await res.text();
        setSuspendStatus({ message: txt || `Failed to unsuspend: ${res.status}`, isError: true });
      } else {
        setSuspendStatus({ message: 'User unsuspended successfully', isError: false });
        await fetchUsers();
      }
    } catch (err: any) {
      setSuspendStatus({ message: err?.message || 'Failed to unsuspend user', isError: true });
    }
  }

  function confirmDelete(u: User) {
    setUserToDelete(u);
    setShowDeleteDialog(true);
  }

  async function handleDelete() {
    if (!userToDelete) return;
    
    try {
      const res = await apiFetch(`/api/users/${userToDelete._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.text()) || `Delete failed: ${res.status}`);
      await fetchUsers();
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user');
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {editingId ? 'Edit User' : 'Create New User'}
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
                placeholder="Username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password {!editingId && <span className="text-red-500">*</span>}
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? 'Leave blank to keep current' : ''}
                {...(!editingId ? { required: true } : {})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black"
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#456CBD] text-white rounded-lg hover:bg-[#3a5ba0] transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editingId ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Users</h2>
          
          {loading && users.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#456CBD]"></div>
            </div>
          ) : error && users.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              No users found. Create your first user!
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div 
                  key={user._id} 
                  className="p-4 bg-white rounded-lg shadow-md transition-shadow flex justify-between items-start"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{user.username || user.email.split('@')[0]}</h3>
                      <p className="text-gray-600 mt-1">{user.email}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Role: {user.role}</span>
                        <span>Status: {user.suspended ? 'Suspended' : 'Active'}</span>
                        {user.suspended && user.suspendedUntil && (
                          <span>Until: {new Date(user.suspendedUntil as any).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => startEdit(user)}
                      className="p-2 text-[#456CBD] hover:bg-[#456CBD] hover:bg-opacity-10 rounded-full transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openSuspendDialog(user)}
                      className="p-2 text-yellow-600 hover:bg-yellow-600 hover:bg-opacity-10 rounded-full transition-colors"
                      title={user.suspended ? 'Unsuspend' : 'Suspend'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => confirmDelete(user)}
                      className="p-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-full transition-colors"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && userToDelete && (
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
          <div className="fixed z-50 inset-0 overflow-y-auto flex items-center justify-center min-h-screen px-4 bg-black bg-opacity-30">
            <Dialog.Panel className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <Dialog.Title className="text-xl font-bold mb-4">Confirm Delete</Dialog.Title>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete user <strong>{userToDelete.email || userToDelete.username}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center gap-2"
                >
                  Delete User
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      {/* Suspend Confirmation Dialog */}
      {showSuspendDialog && suspendTarget && (
        <Dialog open={showSuspendDialog} onClose={() => setShowSuspendDialog(false)}>
          <div className="fixed z-50 inset-0 overflow-y-auto flex items-center justify-center min-h-screen px-4 bg-black bg-opacity-30">
            <Dialog.Panel className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
               <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">Suspend User</Dialog.Title>
              <p className="text-black mb-4">Choose suspension duration for <strong>{suspendTarget.email || suspendTarget.username}</strong>.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <input 
                    type="radio" 
                    id="days" 
                    name="suspendType" 
                    checked={!suspendPermanent} 
                    onChange={() => setSuspendPermanent(false)} 
                    className="text-[#456CBD]"
                  />
                  <label htmlFor="days" className="text-gray-700">Days</label>
                  <input 
                    type="number" 
                    className="ml-2 px-2 py-1 border rounded text-gray-900" 
                    placeholder="Days" 
                    value={suspendDays} 
                    onChange={e => setSuspendDays(e.target.value)} 
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input type="radio" id="perm" name="suspendType" checked={suspendPermanent} onChange={() => setSuspendPermanent(true)} />
                  <label htmlFor="perm" className="text-gray-700">Permanent</label>
                </div>
                {suspendStatus && (
                  <div className={`p-3 rounded-lg ${suspendStatus.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-black'}`}>
                    {suspendStatus.message}
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => { setShowSuspendDialog(false); setSuspendTarget(null); setSuspendStatus(null); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                  {suspendTarget.suspended ? (
                    <button onClick={handleUnsuspendFromDialog} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Unsuspend</button>
                  ) : (
                    <button onClick={handleConfirmSuspend} className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Suspend</button>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}