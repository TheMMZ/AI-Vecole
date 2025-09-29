"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  suspended?: boolean;
};

const defaultForm = { email: '', name: '', password: '', role: 'user' };

export default function UserCenter() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/users');
      if (!res.ok) {
        // Try to read body as text or json for useful message
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
        const payload: any = { name: form.name, role: form.role };
        if (form.password) payload.password = form.password;
        {
          const res = await apiFetch(`/api/users/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
          if (!res.ok) throw new Error((await res.text()) || `Update failed: ${res.status}`);
        }
        setEditingId(null);
      } else {
        // create
        {
          const res = await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(form) });
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
    setForm({ email: u.email, name: u.name, password: '', role: u.role });
  }

  async function handleSuspend(u: User) {
    // toggle suspended flag; server should interpret this and accept a body like { suspended: true }
    try {
      const res = await apiFetch(`/api/users/${u._id}`, { method: 'PUT', body: JSON.stringify({ suspended: !u.suspended }) });
      if (!res.ok) throw new Error((await res.text()) || `Failed to suspend: ${res.status}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to suspend user');
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(`Delete user ${u.email || u.name}? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/api/users/${u._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.text()) || `Delete failed: ${res.status}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-2xl font-extrabold mb-4">Users Center</h2>

      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-bold mb-3">Create / Edit User</h3>
        {error ? <div className="text-sm text-red-600 mb-2">{error}</div> : null}
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="col-span-1 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              className="mt-1 block w-full rounded-full border-gray-200 shadow-sm"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              type="email"
            />
          </div>
          <div className="col-span-1 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              className="mt-1 block w-full rounded-full border-gray-200 shadow-sm"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              type="text"
            />
          </div>
          <div className="col-span-1 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              className="mt-1 block w-full rounded-full border-gray-200 shadow-sm"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              type="password"
              placeholder={editingId ? 'Leave blank to keep' : ''}
              {...(!editingId ? { required: true } : {})}
            />
          </div>
          <div className="col-span-1 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full rounded-full border-gray-200 shadow-sm"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-4 mt-3">
            <button className="px-4 py-2 rounded-full bg-primary text-white font-semibold" type="submit">
              {editingId ? 'Update User' : 'Create User'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="ml-3 px-4 py-2 rounded-full bg-gray-200 text-gray-700"
                onClick={() => {
                  setEditingId(null);
                  setForm(defaultForm);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-3">All Users</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Suspended</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t">
                    <td className="px-3 py-2 text-sm">{u.email}</td>
                    <td className="px-3 py-2 text-sm">{u.name}</td>
                    <td className="px-3 py-2 text-sm">{u.role}</td>
                    <td className="px-3 py-2 text-sm">{u.suspended ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-sm">
                      <button className="text-sm text-blue-600 mr-3" onClick={() => startEdit(u)}>
                        Edit
                      </button>
                      <button className="text-sm text-yellow-600 mr-3" onClick={() => handleSuspend(u)}>
                        {u.suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                      <button className="text-sm text-red-600" onClick={() => handleDelete(u)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
