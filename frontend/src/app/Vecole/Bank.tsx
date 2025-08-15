"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";

type Grade = {
  _id: string;
  name: string;
};
type Standard = {
  _id: string;
  name: string;
};
 

type Bank = {
  _id: string;
  title: string;
  description: string;
  createdBy?: string;
  gradeIds?: string[];
  standardIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export default function BankForm() {
  const [contents, setContents] = useState<{_id: string; title?: string; filename?: string}[]>([]);
  const [showGenDialog, setShowGenDialog] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  useEffect(() => {
    // Fetch contents for item generation
    fetch("http://localhost:4000/api/content")
      .then(res => res.json())
      .then(data => setContents(Array.isArray(data) ? data : []));
    // Fetch grades
    fetch("http://localhost:4000/api/grades")
      .then(res => res.json())
      .then(data => setGrades(Array.isArray(data) ? data : []));
    // Fetch standards
    fetch("http://localhost:4000/api/standards")
      .then(res => res.json())
      .then(data => setStandards(Array.isArray(data) ? data : []));
  }, []);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    gradeIds: string[];
    standardIds: string[];
  }>({
    title: "",
    description: "",
    gradeIds: [],
    standardIds: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch banks from API
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:4000/api/banks");
        const data = await response.json();
        if (response.ok) {
          setBanks(data);
        } else {
          setError(data.message || "Failed to fetch banks");
        }
      } catch (err) {
        console.error("Network error occurred", err);
        setError("Network error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, selectedOptions } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Array.from(selectedOptions).map(opt => opt.value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const url = editingId ? `http://localhost:4000/api/banks/${editingId}` : "http://localhost:4000/api/banks";
      const method = editingId ? "PUT" : "POST";
      // Filter out empty strings from gradeIds and standardIds
      const cleanFormData = {
        ...formData,
        gradeIds: formData.gradeIds.filter(id => id),
        standardIds: formData.standardIds.filter(id => id)
      };
      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanFormData),
      };
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      if (response.ok) {
        // After update or create, re-fetch the banks list for consistency
        const refreshed = await fetch("http://localhost:4000/api/banks");
        const refreshedData = await refreshed.json();
        setBanks(refreshedData);
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

  const handleEdit = (bank: Bank) => {
    setFormData({
      title: bank.title,
      description: bank.description,
      gradeIds: bank.gradeIds || [],
      standardIds: bank.standardIds || [],
    });
    setEditingId(bank._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank?")) return;
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:4000/api/banks/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        // After delete, re-fetch the banks list for consistency
        const refreshed = await fetch("http://localhost:4000/api/banks");
        const refreshedData = await refreshed.json();
        setBanks(refreshedData);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete bank");
      }
    } catch (err) {
      console.error("Network error occurred", err);
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", gradeIds: [], standardIds: [] });
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
          {editingId ? "Edit Bank" : "Create New Bank"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Bank Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
              placeholder="e.g., Mathematics Grade 5"
            />
          </div>

          <div>
            <label htmlFor="gradeIds" className="block text-sm font-medium text-gray-700 mb-1">
              Grades
            </label>
            <select
              id="gradeIds"
              name="gradeIds"
              value={formData.gradeIds[0] || ""}
              onChange={e => setFormData(prev => ({ ...prev, gradeIds: [e.target.value] }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black"
            >
              <option value="" disabled>Select a grade</option>
              {grades.map(grade => (
                <option key={grade._id} value={grade._id}>{grade.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="standardIds" className="block text-sm font-medium text-gray-700 mb-1">
              Standards
            </label>
            <select
              id="standardIds"
              name="standardIds"
              value={formData.standardIds[0] || ""}
              onChange={e => setFormData(prev => ({ ...prev, standardIds: [e.target.value] }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black"
            >
              <option value="" disabled>Select a standard</option>
              {standards.map(standard => (
                <option key={standard._id} value={standard._id}>{standard.name}</option>
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
              placeholder="Brief description of this question bank..."
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
                  {editingId ? "Update Bank" : "Create Bank"}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Question Banks</h2>
          
          {isLoading && banks.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#456CBD]"></div>
            </div>
          ) : error && banks.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              {error}
            </div>
          ) : banks.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              No banks found. Create your first question bank!
            </div>
          ) : (
            <div className="space-y-4">
              {banks.map(bank => (
                <div 
                  key={bank._id} 
                  className="p-4 bg-white rounded-lg shadow-md transition-shadow flex justify-between items-start"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🏦</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{bank.title}</h3>
                      {bank.description && (
                        <p className="text-gray-600 mt-1">{bank.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Created: {new Date(bank.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(bank.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleEdit(bank)}
                      className="p-2 text-[#456CBD] hover:bg-[#456CBD] hover:bg-opacity-10 rounded-full transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(bank._id)}
                      className="p-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-full transition-colors"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setSelectedBankId(bank._id); setShowGenDialog(true); setGenError(""); setGenSuccess(""); }}
                      className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16a34a] transition-colors text-sm font-semibold"
                    >
                      Generate Items
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
      {/* Generate Items Dialog (outside banks.map) */}
      {showGenDialog && (
        <Dialog open={showGenDialog} onClose={() => setShowGenDialog(false)}>
          <div className="fixed z-50 inset-0 overflow-y-auto flex items-center justify-center min-h-screen px-4 bg-black bg-opacity-30">
            <Dialog.Panel className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <Dialog.Title className="text-xl font-bold mb-4">Generate Items for Bank</Dialog.Title>
              <div className="mb-4">
                <label htmlFor="content-select" className="block text-sm font-medium text-gray-700 mb-1">Select Content</label>
                <select
                  id="content-select"
                  value={selectedContentId}
                  onChange={e => setSelectedContentId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black"
                >
                  <option value="" disabled>Select content</option>
                  {contents.map(content => (
                    <option key={content._id} value={content._id} style={{ color: 'black' }}>{content.title || content.filename || 'Untitled Content'}</option>
                  ))}
                </select>
              </div>
              {genError && <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">{genError}</div>}
              {genSuccess && <div className="mb-2 p-2 bg-green-100 text-green-700 rounded">{genSuccess}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowGenDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={genLoading}
                >Cancel</button>
                <button
                  onClick={async () => {
                    if (!selectedBankId || !selectedContentId) {
                      setGenError("Please select content.");
                      return;
                    }
                    setGenLoading(true);
                    setGenError("");
                    setGenSuccess("");
                    try {
                      const res = await fetch("http://localhost:4000/api/items/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bankId: selectedBankId, contentId: selectedContentId })
                      });
                      if (res.ok) {
                        setGenSuccess("Items generated and saved successfully!");
                      } else {
                        const data = await res.json();
                        setGenError(data.message || "Failed to generate items.");
                      }
                    } catch (err) {
                      setGenError("Network error occurred.");
                    } finally {
                      setGenLoading(false);
                    }
                  }}
                  className="px-6 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16a34a] transition-colors font-semibold flex items-center gap-2"
                  disabled={genLoading || !selectedContentId}
                >
                  {genLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Items"
                  )}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}