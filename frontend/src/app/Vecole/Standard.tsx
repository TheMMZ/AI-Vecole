
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Standard = {
  _id: string;
  name: string;
  description: string;
  gradeId: string;
  createdAt: string;
  updatedAt: string;
};

export default function StandardForm() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [grades, setGrades] = useState<{_id: string; name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gradeId: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:4000/api/standards");
        const data = await response.json();
        if (response.ok) {
          setStandards(data);
        } else {
          setError(data.message || "Failed to fetch standards");
        }
      } catch (err) {
        console.error("Network error occurred", err);
        setError("Network error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStandards();
    fetch("http://localhost:4000/api/grades")
      .then(res => res.json())
      .then(data => setGrades(Array.isArray(data) ? data : []));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const url = editingId ? `http://localhost:4000/api/standards/${editingId}` : "http://localhost:4000/api/standards";
      const method = editingId ? "PUT" : "POST";
      const fetchOptions: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      };
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      if (response.ok) {
        const refreshed = await fetch("http://localhost:4000/api/standards");
        const refreshedData = await refreshed.json();
        setStandards(refreshedData);
        resetForm();
      } else {
        setError(data.message || "Operation failed");
      }
    } catch (err) {
      console.error("Network error occurred", err);
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (standard: Standard) => {
  setFormData({ name: standard.name, description: standard.description, gradeId: standard.gradeId || "" });
    setEditingId(standard._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this standard?")) return;
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:4000/api/standards/${id}`, { method: "DELETE" });
      if (response.ok) {
        const refreshed = await fetch("http://localhost:4000/api/standards");
        const refreshedData = await refreshed.json();
        setStandards(refreshedData);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete standard");
      }
    } catch (err) {
      console.error("Network error occurred", err);
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
  setFormData({ name: "", description: "", gradeId: "" });
    setEditingId(null);
  };

  return (
  <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {editingId ? "Edit Standard" : "Create New Standard"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Standard Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
              placeholder="e.g., Common Core Math"
            />
          </div>
          <div>
            <label htmlFor="gradeId" className="block text-sm font-medium text-gray-700 mb-1">
              Grade <span className="text-red-500">*</span>
            </label>
            <select
              id="gradeId"
              name="gradeId"
              value={formData.gradeId}
              onChange={e => setFormData(prev => ({ ...prev, gradeId: e.target.value }))}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black"
            >
              <option value="" disabled>Select a grade</option>
              {grades.map(grade => (
                <option key={grade._id} value={grade._id}>{grade.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
              placeholder="Brief description of this standard..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[#456CBD] text-white rounded-lg hover:bg-[#3a5ba0] transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingId ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {editingId ? "Update Standard" : "Create Standard"}
                </>
              )}
            </button>
          </div>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </motion.div>
      {/* Standards List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Standards</h2>
          {isLoading && standards.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#456CBD]"></div>
            </div>
          ) : error && standards.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              {error}
            </div>
          ) : standards.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              No standards found. Create your first standard!
            </div>
          ) : (
            <div className="space-y-4">
              {standards.map(standard => (
                <div
                  key={standard._id}
                  className="p-4 bg-white rounded-lg shadow-md transition-shadow flex justify-between items-start"
                >
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{standard.name}</h3>
                    {standard.description && (
                      <p className="text-gray-600 mt-1">{standard.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Created: {new Date(standard.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(standard.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(standard)}
                      className="p-2 text-[#456CBD] hover:bg-[#456CBD] hover:bg-opacity-10 rounded-full transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(standard._id)}
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
    </div>
  );
}
