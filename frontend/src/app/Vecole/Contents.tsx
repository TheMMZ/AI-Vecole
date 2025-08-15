"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { motion } from "framer-motion";

type ContentFile = {
  _id: string;
  filename: string;
  title?: string;
  url: string;
  uploadedAt: string;
};

export default function Contents() {
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/content");
      const data = await res.json();
      if (res.ok) {
        setFiles(data);
      } else {
        setError(data.message || "Failed to fetch content files");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Set default title from filename (without extension)
      const filename = e.target.files[0].name;
      setFileTitle(filename.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileTitle(e.target.value);
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", fileTitle);
      
      const res = await fetch("http://localhost:4000/api/content/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        fetchFiles();
        setSelectedFile(null);
        setFileTitle("");
      } else {
        setError(data.message || "Failed to upload file");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:4000/api/content/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        fetchFiles();
      } else {
        setError(data.message || "Failed to delete file");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Content</h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="file-title" className="block text-sm font-medium text-gray-700 mb-1">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="file-title"
              value={fileTitle}
              onChange={handleTitleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#456CBD] focus:border-[#456CBD] outline-none transition text-black placeholder-black"
              placeholder="e.g., Mathematics Grade 5 Textbook"
            />
          </div>

          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
              PDF File <span className="text-red-500">*</span>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-[#456CBD] file:text-white
                hover:file:bg-[#3a5ba0]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading || !selectedFile || !fileTitle}
              className="px-6 py-2 bg-[#456CBD] text-white rounded-lg hover:bg-[#3a5ba0] transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                "Upload PDF"
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

      {/* Files List Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Uploaded Files</h2>
          
          {isLoading && files.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#456CBD]"></div>
            </div>
          ) : error && files.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              {error}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              No files uploaded yet. Upload your first PDF!
            </div>
          ) : (
            <div className="space-y-3">
              {files.map(file => (
                <div 
                  key={file._id} 
                  className="p-4 bg-white rounded-lg shadow-md transition-shadow flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-red-500 text-2xl">
                      📄
                    </div>
                    <div>
                      <a
                        href={`http://localhost:4000${file.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#456CBD] hover:underline text-lg"
                        title="Open PDF"
                      >
                        {file.title || file.filename}
                      </a>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="p-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-full transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}