"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Item = {
  _id: string;
  question?: string;
  options?: string[];
  answer?: string;
  metadata?: {
    difficulty?: string;
    tags?: string[];
  };
  // legacy/manual fields
  name?: string;
  description?: string;
  bankId: string;
  contentId: string;
  createdAt: string;
  updatedAt: string;
};

export default function ItemForm() {
  const [items, setItems] = useState<Item[]>([]);
  const [banks, setBanks] = useState<{_id: string; title: string}[]>([]);
  const [contents, setContents] = useState<{_id: string; title?: string; filename?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    question: "",
    options: [""],
    answer: "",
    metadata: { difficulty: "", tags: [""] },
    bankId: "",
    contentId: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:4000/api/items", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (response.ok) {
          setItems(data);
        } else {
          setError(data.message || "Failed to fetch items");
        }
      } catch (err) {
        console.error("Network error occurred", err);
        setError("Network error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/banks", {
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => setBanks(Array.isArray(data) ? data : []));
    fetch("http://localhost:4000/api/content", {
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => setContents(Array.isArray(data) ? data : []));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "difficulty") {
      setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, difficulty: value } }));
    } else if (name === "tags") {
      setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, tags: value.split(",").map(t => t.trim()) } }));
    } else if (name.startsWith("option-")) {
      const idx = parseInt(name.split("-")[1]);
      setFormData(prev => {
        const newOptions = [...prev.options];
        newOptions[idx] = value;
        return { ...prev, options: newOptions };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const url = editingId ? `http://localhost:4000/api/items/${editingId}` : "http://localhost:4000/api/items";
      const method = editingId ? "PUT" : "POST";
      const fetchOptions: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      };
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...(fetchOptions.headers || {}),
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      if (response.ok) {
        const refreshed = await fetch("http://localhost:4000/api/items");
        const refreshedData = await refreshed.json();
        setItems(refreshedData);
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

  const handleEdit = (item: Item) => {
    setFormData({
      question: item.question || "",
      options: item.options && item.options.length > 0 ? item.options : [""],
      answer: item.answer || "",
      metadata: {
        difficulty: item.metadata?.difficulty || "",
        tags: item.metadata?.tags || [""]
      },
      bankId: item.bankId || "",
      contentId: item.contentId || ""
    });
    setEditingId(item._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/items/${id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const refreshed = await fetch("http://localhost:4000/api/items");
        const refreshedData = await refreshed.json();
        setItems(refreshedData);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete item");
      }
    } catch (err) {
      console.error("Network error occurred", err);
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      options: [""],
      answer: "",
      metadata: { difficulty: "", tags: [""] },
      bankId: "",
      contentId: ""
    });
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
          {editingId ? "Edit Item" : "Create New Item"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="question"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
              placeholder="e.g., What is 2+2?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Options <span className="text-red-500">*</span></label>
            {formData.options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 mb-1">
                <input
                  type="text"
                  name={`option-${idx}`}
                  value={opt}
                  onChange={handleInputChange}
                  required
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
                  placeholder={`Option ${idx + 1}`}
                />
                {formData.options.length > 1 && (
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }))} className="text-red-500 px-2">Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, options: [...prev.options, ""] }))} className="text-blue-600 mt-1">+ Add Option</button>
          </div>
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
              Answer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="answer"
              name="answer"
              value={formData.answer}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
              placeholder="e.g., 4"
            />
          </div>
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.metadata.difficulty}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black"
            >
              <option value="">Select difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.metadata.tags.join(", ")}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
              placeholder="e.g., Math, Algebra"
            />
          </div>
          <div>
            <label htmlFor="bankId" className="block text-sm font-medium text-gray-700 mb-1">
              Bank <span className="text-red-500">*</span>
            </label>
            <select
              id="bankId"
              name="bankId"
              value={formData.bankId}
              onChange={e => setFormData(prev => ({ ...prev, bankId: e.target.value }))}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black"
              style={{ color: 'black' }}
            >
              <option value="" disabled style={{ color: 'black' }}>Select a bank</option>
              {banks.map(bank => (
                <option key={bank._id} value={bank._id} style={{ color: 'black' }}>{bank.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contentId" className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <select
              id="contentId"
              name="contentId"
              value={formData.contentId}
              onChange={e => setFormData(prev => ({ ...prev, contentId: e.target.value }))}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black"
              style={{ color: 'black' }}
            >
              <option value="" disabled style={{ color: 'black' }}>Select content</option>
              {contents.map(content => (
                <option key={content._id} value={content._id} style={{ color: 'black' }}>{content.title || content.filename || 'Untitled Content'}</option>
              ))}
            </select>
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
                  {editingId ? "Update Item" : "Create Item"}
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
      {/* Items List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Items</h2>
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#456CBD]"></div>
            </div>
          ) : error && items.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              No items found. Create your first item!
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div
                  key={item._id}
                  className="p-4 bg-white rounded-lg shadow-md transition-shadow flex justify-between items-start"
                >
                  <div>
                    {/* Prefer AI-generated fields, fallback to manual */}
                    <h3 className="font-bold text-lg text-gray-800">
                      {item.question || item.name || "Untitled Item"}
                    </h3>
                    {item.options && item.options.length > 0 && (
                      <ul className="list-disc ml-6 mt-1 text-gray-700">
                        {item.options.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    )}
                    {item.answer && (
                      <div className="mt-1 text-green-700 font-semibold">Answer: {item.answer}</div>
                    )}
                    {item.metadata && (
                      <div className="mt-1 text-sm text-gray-500 flex gap-4">
                        {item.metadata.difficulty && <span>Difficulty: {item.metadata.difficulty}</span>}
                        {item.metadata.tags && item.metadata.tags.length > 0 && (
                          <span>Tags: {item.metadata.tags.join(", ")}</span>
                        )}
                      </div>
                    )}
                    {/* Fallback for manual/legacy items */}
                    {item.description && !item.question && (
                      <p className="text-gray-600 mt-1">{item.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-[#456CBD] hover:bg-[#456CBD] hover:bg-opacity-10 rounded-full transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
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
