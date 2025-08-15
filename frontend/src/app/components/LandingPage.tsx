"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import AppFooter from "./AppFooter";

export default function LandingPage() {
  const router = useRouter();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const features = [
    {
      emoji: "📚",
      title: "PDF to Questions",
      description: "Upload textbook PDFs and get AI-generated assessment items in seconds"
    },
    {
      emoji: "🎯",
      title: "Standards-Aligned",
      description: "Automatically align questions with educational standards by grade level"
    },
    {
      emoji: "📊",
      title: "Analytics Dashboard",
      description: "Track usage and performance with intuitive visual analytics"
    },
    {
      emoji: "⚡",
      title: "Fast & Scalable",
      description: "Built with modern tech stack for seamless performance at any scale"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  const handleGetStarted = () => {
    router.push("/AuthCard");
  };

  return (
    <>
      <Head>
        <title>Ecole - AI-Powered Item Bank Platform for Teachers</title>
        <meta name="description" content="Convert textbook PDFs into standards-aligned question banks with AI" />
      </Head>

      <header className="w-full h-24 bg-white shadow flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <svg width="110" height="32" viewBox="0 0 110 32" fill="none">
            <path 
              d="M18 18L24 28L36 8" 
              stroke="#22c55e" 
              strokeWidth="7" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <text 
              x="40" 
              y="25" 
              fontFamily="'Segoe UI', Arial, sans-serif" 
              fontSize="24" 
              fill="#456CBD" 
              fontWeight="bold"
            >
              ecole
            </text>
          </svg>
        </div>
        <nav>
          <button
            className="px-6 py-2 rounded-full bg-[#456CBD] text-white font-semibold hover:bg-[#3a5ba0] transition-colors"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </nav>
      </header>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section 
          className="relative py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: "#e9ded8" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">
              Transform Teaching Materials <span className="text-[#456CBD]">with AI</span> ✨
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Convert textbook PDFs into standards-aligned question banks in seconds. 
              The modern way to create assessments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="px-8 py-4 rounded-full bg-[#456CBD] text-white font-bold text-lg hover:bg-[#3a5ba0] transition-colors shadow-lg hover:shadow-xl"
                onClick={handleGetStarted}
              >
                Try It Free 🚀
              </button>
              <button className="px-8 py-4 rounded-full bg-white text-[#456CBD] font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl border-2 border-[#456CBD]">
                See How It Works ▶
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative w-full max-w-4xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-[#d8cec7] to-[#e6dbd4] rounded-3xl blur-lg opacity-75"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              <img 
                src="/dashboard-preview.png" 
                alt="Dashboard Preview" 
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#dfd5ce" }}>
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Powerful Features</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to create, manage, and analyze assessments
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-4xl mb-4">{feature.emoji}</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Animated Feature Showcase */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#e6dbd4" }}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8"
                >
                  <h2 className="text-4xl font-bold text-gray-800 mb-4">
                    {features[currentFeature].emoji} {features[currentFeature].title}
                  </h2>
                  <p className="text-xl text-gray-600">
                    {features[currentFeature].description}
                  </p>
                </motion.div>
              </AnimatePresence>
              
              <div className="flex gap-2 mt-6">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAnimating(true);
                      setCurrentFeature(index);
                      setTimeout(() => setIsAnimating(false), 1000);
                    }}
                    className={`w-3 h-3 rounded-full ${currentFeature === index ? 'bg-[#456CBD]' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  transition: { 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut" 
                  } 
                }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-[#d8cec7] to-[#e9ded8] rounded-3xl blur-lg opacity-75"></div>
                <div className="relative bg-white p-6 rounded-2xl shadow-2xl">
                  <img 
                    src={`/feature-${currentFeature + 1}.png`} 
                    alt={`Feature ${currentFeature + 1}`} 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 text-center" style={{ backgroundColor: "#d8cec7" }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Ready to Transform Your Teaching?</h2>
            <p className="text-xl text-gray-600 mb-10">
              Join hundreds of educators saving hours each week with AI-powered assessment creation
            </p>
            <button className="px-10 py-5 rounded-full bg-[#456CBD] text-white font-bold text-xl hover:bg-[#3a5ba0] transition-colors shadow-lg hover:shadow-xl animate-pulse">
              Get Started Today - It's Free! 🎉
            </button>
            
            <div className="mt-16 flex flex-wrap justify-center gap-6">
              {["👩‍🏫", "👨‍🏫", "📝", "🧑‍🏫", "📚", "🎓"].map((emoji, index) => (
                <motion.div
                  key={index}
                  animate={{ 
                    y: [0, -15, 0],
                    transition: { 
                      duration: 3 + index,
                      repeat: Infinity,
                      ease: "easeInOut" 
                    } 
                  }}
                  className="text-4xl"
                >
                  {emoji}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      <AppFooter />
    </>
  );
}
