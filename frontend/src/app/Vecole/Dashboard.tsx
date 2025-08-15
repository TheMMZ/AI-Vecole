import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type ContentFile = {
  _id: string;
  filename: string;
  title?: string;
  uploadedAt: string;
};

type StatsCardProps = {
  title: string;
  value: number;
  icon: string;
  color: string;
};

const StatsCard = ({ title, value, icon, color }: StatsCardProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4"
        style={{ backgroundColor: `${color}20`, color: color }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

export default function VecolePage() {
  const [stats, setStats] = useState({
    banks: 0,
    items: 0,
    grades: 0,
    standards: 0,
    uploadedContent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentUploads, setRecentUploads] = useState<ContentFile[]>([]);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      setError("");
      try {
        const [banksRes, itemsRes, gradesRes, standardsRes, contentRes] = await Promise.all([
          fetch("http://localhost:4000/api/banks"),
          fetch("http://localhost:4000/api/items"),
          fetch("http://localhost:4000/api/grades"),
          fetch("http://localhost:4000/api/standards"),
          fetch("http://localhost:4000/api/content")
        ]);
        if (!banksRes.ok || !itemsRes.ok || !gradesRes.ok || !standardsRes.ok || !contentRes.ok) {
          throw new Error("Failed to fetch one or more resources");
        }
        const [banks, items, grades, standards, content] = await Promise.all([
          banksRes.json(),
          itemsRes.json(),
          gradesRes.json(),
          standardsRes.json(),
          contentRes.json()
        ]);
        setStats({
          banks: Array.isArray(banks) ? banks.length : 0,
          items: Array.isArray(items) ? items.length : 0,
          grades: Array.isArray(grades) ? grades.length : 0,
          standards: Array.isArray(standards) ? standards.length : 0,
          uploadedContent: Array.isArray(content) ? content.length : 0
        });
        // Sort by uploadedAt descending and take the latest 10
        if (Array.isArray(content)) {
          const sorted = [...content].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          setRecentUploads(sorted.slice(0, 10));
        } else {
          setRecentUploads([]);
        }
      } catch (err) {
        setError("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-800 mb-8"
          >
            Dashboard Overview
          </motion.h1>
          {/* Stats Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#456CBD]"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 mb-8">{error}</div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12"
            >
              <StatsCard 
                title="Banks" 
                value={stats.banks} 
                icon="🏦" 
                color="#456CBD" 
              />
              <StatsCard 
                title="Items" 
                value={stats.items} 
                icon="📝" 
                color="#22C55E" 
              />
              <StatsCard 
                title="Grades" 
                value={stats.grades} 
                icon="🎓" 
                color="#F59E0B" 
              />
              <StatsCard 
                title="Standards" 
                value={stats.standards} 
                icon="🎯" 
                color="#EF4444" 
              />
              <StatsCard 
                title="Uploaded Content" 
                value={stats.uploadedContent} 
                icon="📤" 
                color="#8B5CF6" 
              />
            </motion.div>
          )}

          {/* Recent Activity Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-md mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: "Created new item bank", date: "2 hours ago", icon: "➕" },
                { action: "Generated 15 MCQ items", date: "5 hours ago", icon: "🤖" },
                { action: "Uploaded new PDF content", date: "1 day ago", icon: "📄" },
                { action: "Aligned 8 items to standards", date: "2 days ago", icon: "🔗" }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">📤</span>
                  <span>Upload New PDF</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">🏦</span>
                  <span>Create New Bank</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">📊</span>
                  <span>View Analytics</span>
                </button>
              </div>
            </motion.div>

            {/* Recent Uploads */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="bg-white p-6 rounded-xl shadow-md md:col-span-2"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Uploads</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentUploads.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No recent uploads found.</td>
                      </tr>
                    ) : (
                      recentUploads.map((upload, index) => (
                        <tr key={upload._id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{upload.title || upload.filename}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">PDF</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(upload.uploadedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Processed</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
