"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

import {
  ShieldCheck,
  Zap,
  Lock,
  FileText,
  Search,
  ArrowRight,
  CheckCircle2,
  EyeOff,
  Database,
  CloudOff,
  Cpu,
  Sparkles,
} from "lucide-react";
const SectionDivider = ({
  glowColor = "rgba(59,130,246,0.5)",
}) => (
  <div className="relative w-full h-24 overflow-hidden">
    
    <div
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px"
      style={{
        background: `linear-gradient(
          90deg,
          transparent 0%,
          ${glowColor} 20%,
          white 50%,
          ${glowColor} 80%,
          transparent 100%
        )`,
        boxShadow: `
          0 0 25px ${glowColor},
          0 0 60px ${glowColor}
        `,
      }}
    />

    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-24 rounded-full blur-3xl opacity-30"
      style={{
        background: glowColor,
      }}
    />
  </div>
);

export default function DocSaathi() {
  const [text, setText] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [summary, setSummary] = useState(`
SUMMARY:
- Your document analysis will appear here.
- AI will generate easy explanations.

IMPORTANT POINTS:
- Risks and key details will appear here.

KEY DETAILS:
- Names, dates, and important information.
`);

  const [activeTab, setActiveTab] = useState("paste");

  const [showExample, setShowExample] = useState(false);

  const handleAnalyze = async () => {
    let contentToAnalyze = "";

    if (activeTab === "paste") {
      if (!text.trim()) {
        alert("Please paste some text first!");
        return;
      }

      contentToAnalyze = text;
    }

    if (activeTab === "upload") {
      if (!pdfFile) {
        alert("Please select a PDF file!");
        return;
      }

      contentToAnalyze = pdfFile.name;
    }

    if (activeTab === "ocr") {
      if (!imageFile) {
        alert("Please select an image!");
        return;
      }

      contentToAnalyze = imageFile.name;
    }

    setIsAnalyzing(true);

    setSummary(`
SUMMARY:
- AI is analyzing your document...

IMPORTANT POINTS:
- Please wait a few seconds.

KEY DETAILS:
- Extracting important information.
`);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          text: contentToAnalyze,
          language: "English",
        }),
      });

      const data = await response.json();

      console.log("API RESULT:", data);

      if (data.result) {
        setSummary(data.result);
      } else if (data.error) {
        setSummary(`
SUMMARY:
- Error occurred during analysis.

IMPORTANT POINTS:
- ${data.error}

KEY DETAILS:
- Try again later.
`);
      } else {
        setSummary(`
SUMMARY:
- No analysis received.

IMPORTANT POINTS:
- API returned empty response.

KEY DETAILS:
- Please check backend.
`);
      }
    } catch (error) {
      console.error(error);

      setSummary(`
SUMMARY:
- Connection failed.

IMPORTANT POINTS:
- Could not connect to AI service.

KEY DETAILS:
- Check API key and internet connection.
`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },

    animate: { opacity: 1, y: 0 },

    transition: { duration: 0.6 },
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-white">
      <div className="mesh-bg" />

      {/* NAVBAR */}

      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
         <div className="flex items-center gap-2">
  <div className="flex items-center gap-3">
  {/* Logo Container jisko round kiya gaya hai */}
  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white">
    <img 
      src="/logo.png" // Apni image ka path yahan check karein
      alt="DocSaathi Logo"
      className="w-full h-full object-cover" 
    />
  </div>

  {/* Brand Name */}
  <span className="text-2xl font-bold tracking-tight">
    <span className="text-white">Doc</span>
    <span className="text-[#14b8a6]">Saathi</span>
  </span>
</div>
</div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a
              href="#features"
              className="hover:text-primary transition-colors"
            >
              Features
            </a>

            <a
              href="#security"
              className="hover:text-primary transition-colors"
            >
              Security
            </a>

            <a href="#analysis">
              <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full transition-all font-semibold shadow-lg shadow-primary/20">
                Get Started
              </button>
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-32">

        {/* HERO */}

        <section className="px-6 pb-32 pt-10 max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}

            animate={{ opacity: 1, scale: 1 }}

            transition={{ duration: 0.5 }}

            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8"
          >
            <Sparkles className="w-4 h-4" />

            <span>Made for India • Safe & Private</span>
          </motion.div>

          <motion.h1
            {...fadeInUp}

            className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight"
          >
            Understand Your Documents <br />

            <span className="text-gradient">
              In Simple English
            </span>
          </motion.h1>

          <motion.p
            {...fadeInUp}

            className="text-xl text-slate-400 max-w-2xl mx-auto mb-12"
          >
            Don&apos;t get confused by difficult medical reports or legal papers.
            DocSaathi explains everything in easy words.
          </motion.p>

          <motion.div
            {...fadeInUp}

            className="flex flex-wrap justify-center gap-4"
          >
            <a href="#analysis">
              <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all flex items-center gap-2 group">
                Try It Now

                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </a>

            <button
              onClick={() => setShowExample((prev) => !prev)}

              className="bg-primary/20 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-primary/30 transition-colors"
            >
              {showExample ? "Hide Example" : "Show Example"}
            </button>
          </motion.div>

          {showExample && (
  <div className="flex justify-center mt-8">
    <div className="w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <img
                src="/sample_insight.png"
                alt="Example"

                className="max-w-full rounded-2xl shadow-2xl border border-white/10"
              />

    </div>
  </div>
)}
        </section>
        <SectionDivider glowColor="#3b82f6" />

        {/* HOW IT WORKS */}

        <section
          id="how-it-works"

          className="px-6 py-32 bg-slate-950 border-y border-white/5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_70%)]" />
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                How It Works
              </h2>

              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Upload your document and let AI explain everything simply.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload or Paste",
                  desc: "Paste text, upload PDFs, or scan images.",
                },

                {
                  step: "02",
                  title: "AI Analysis",
                  desc: "AI reads and simplifies difficult words instantly.",
                },

                {
                  step: "03",
                  title: "Understand Easily",
                  desc: "Get summaries and important insights clearly.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}

                  initial={{ opacity: 0, y: 20 }}

                  whileInView={{ opacity: 1, y: 0 }}

                  viewport={{ once: true }}

                  transition={{ delay: i * 0.15 }}

                  className="bg-slate-900/40 border border-white/5 rounded-3xl p-10 text-center"
                >
                  <div className="text-5xl font-bold text-primary/30 mb-6">
                    {item.step}
                  </div>

                  <h3 className="text-2xl font-bold mb-4">
                    {item.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <SectionDivider glowColor="#10b981" />

        {/* ANALYSIS */}

        <section
          id="analysis"

          className="px-6 py-32 bg-[#020617] border-y border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                AI Powered Analysis
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                AI Document Analysis
              </h2>

              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Paste your documents and get simple AI explanations.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-1 overflow-hidden">
              <div className="bg-slate-900/50 rounded-[22px] overflow-hidden">

                {/* TABS */}

                <div className="flex border-b border-white/5">
                  {[
                    {
                      id: "paste",
                      label: "Paste Text",
                      icon: FileText,
                    },

                    {
                      id: "upload",
                      label: "Upload PDF",
                      icon: Database,
                    },

                    {
                      id: "ocr",
                      label: "Photo/Image",
                      icon: Search,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}

                      onClick={() => setActiveTab(tab.id)}

                      className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-semibold transition-all ${
                        activeTab === tab.id
                          ? "text-primary bg-primary/5 border-b-2 border-primary"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />

                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-8">

                  {/* PASTE */}

                  {activeTab === "paste" && (
                    <div className="relative">
                      <textarea
                        className="w-full h-64 bg-slate-800/30 border border-white/5 rounded-2xl p-6 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"

                        placeholder="Paste your document here..."

                        value={text}

                        onChange={(e) => setText(e.target.value)}
                      />

                      <div className="absolute bottom-4 right-4">
                        <button
                          onClick={handleAnalyze}

                          disabled={isAnalyzing || !text}

                          className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 fill-current" />
                              Explain This
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PDF */}

                  {activeTab === "upload" && (
                    <div className="text-center border border-dashed border-white/10 rounded-3xl bg-slate-800/20 p-10">
                      <Database className="w-12 h-12 text-primary mx-auto mb-5" />

                      <h3 className="text-2xl font-bold mb-4">
                        Upload PDF
                      </h3>

                      <label className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-2xl font-semibold cursor-pointer">
                        <FileText className="w-5 h-5" />
                        Choose PDF

                        <input
                          type="file"

                          accept=".pdf"

                          className="hidden"

                          onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (file) {
                              setPdfFile(file);
                            }
                          }}
                        />
                      </label>

                      {pdfFile && (
                        <p className="mt-5 text-slate-400">
                          {pdfFile.name}
                        </p>
                      )}

                      <button
                        onClick={handleAnalyze}

                        disabled={isAnalyzing || !pdfFile}

                        className="mt-8 bg-primary px-8 py-3 rounded-xl font-bold"
                      >
                        Analyze PDF
                      </button>
                    </div>
                  )}

                  {/* OCR */}

                  {activeTab === "ocr" && (
                    <div className="text-center border border-dashed border-white/10 rounded-3xl bg-slate-800/20 p-10">
                      <Search className="w-12 h-12 text-primary mx-auto mb-5" />

                      <h3 className="text-2xl font-bold mb-4">
                        Upload Image
                      </h3>

                      <label className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-2xl font-semibold cursor-pointer">
                        <Search className="w-5 h-5" />
                        Choose Image

                        <input
                          type="file"

                          accept="image/*"

                          className="hidden"

                          onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (file) {
                              setImageFile(file);
                            }
                          }}
                        />
                      </label>

                      {imageFile && (
                        <p className="mt-5 text-slate-400">
                          {imageFile.name}
                        </p>
                      )}

                      <button
                        onClick={handleAnalyze}

                        disabled={isAnalyzing || !imageFile}

                        className="mt-8 bg-primary px-8 py-3 rounded-xl font-bold"
                      >
                        Scan & Analyze
                      </button>
                    </div>
                  )}

                 {/* RESULTS */}

<div className="mt-10 space-y-8">

  {/* RESULT CARD */}

  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 shadow-2xl">

    {/* Glow Effect */}
    <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-30" />

    <div className="relative z-10">

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            AI Analysis Result
          </h2>

          <p className="text-slate-400 text-sm">
            Smart breakdown generated by AI
          </p>
        </div>
      </div>

      {/* SECTION PARSER */}

      <div className="space-y-6">

        {summary
          .split("\n\n")
          .filter((section) => section.trim() !== "")
          .map((section, index) => {

            const lines = section
              .split("\n")
              .filter((line) => line.trim() !== "");

            const title = lines[0];

            const items = lines.slice(1);

            const getIcon = () => {
              if (title.includes("SUMMARY")) return "🧠";
              if (title.includes("IMPORTANT")) return "⚠️";
              if (title.includes("KEY")) return "📌";
              return "✨";
            };

            const getBorder = () => {
              if (title.includes("SUMMARY"))
                return "border-cyan-500/20 bg-cyan-500/5";

              if (title.includes("IMPORTANT"))
                return "border-yellow-500/20 bg-yellow-500/5";

              if (title.includes("KEY"))
                return "border-green-500/20 bg-green-500/5";

              return "border-primary/20 bg-primary/5";
            };

            return (
              <motion.div
                key={index}

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ delay: index * 0.1 }}

                className={`rounded-3xl border p-6 backdrop-blur-xl ${getBorder()}`}
              >

                {/* TITLE */}

                <div className="flex items-center gap-3 mb-5">

                  <div className="text-2xl">
                    {getIcon()}
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-wide">
                    {title.replace(/[:]/g, "")}
                  </h3>

                </div>

                {/* ITEMS */}

                <div className="space-y-4">

                  {items.map((item, itemIndex) => (
                    <motion.div
                      key={itemIndex}

                      initial={{ opacity: 0, x: -10 }}

                      animate={{ opacity: 1, x: 0 }}

                      transition={{
                        delay:
                          itemIndex * 0.05 + index * 0.1,
                      }}

                      className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 hover:bg-black/30 transition-all"
                    >

                      <div className="mt-1 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/40 group-hover:scale-125 transition-transform shrink-0" />

                      <p className="text-slate-200 leading-relaxed text-[15px]">
                        {item.replace(/^[-*•]\s*/, "")}
                      </p>

                    </motion.div>
                  ))}

                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  </div>

  {/* STATUS CARD */}

  <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">

    <div className="flex items-center justify-between mb-5">

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
          <ShieldCheck className="w-5 h-5 text-green-400" />
        </div>

        <div>
          <h3 className="font-bold text-white text-lg">
            Processing Status
          </h3>

          <p className="text-sm text-slate-400">
            Live AI processing activity
          </p>
        </div>
      </div>

      <div
        className={`px-4 py-2 rounded-full text-xs font-bold ${
          isAnalyzing
            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            : "bg-green-500/10 text-green-400 border border-green-500/20"
        }`}
      >
        {isAnalyzing ? "ANALYZING" : "COMPLETED"}
      </div>
    </div>

    {/* PROGRESS BAR */}

    <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">

      <motion.div
        initial={{ width: 0 }}

        animate={{
          width: isAnalyzing ? "75%" : "100%",
        }}

        transition={{
          duration: 1.2,
        }}

        className={`h-full rounded-full ${
          isAnalyzing
            ? "bg-gradient-to-r from-cyan-500 to-primary animate-pulse"
            : "bg-gradient-to-r from-green-400 to-green-500"
        }`}
      />

    </div>

    <div className="flex items-center justify-between mt-4 text-sm">

      <p className="text-slate-400">
        {isAnalyzing
          ? "AI is analyzing your document..."
          : "Analysis completed successfully"}
      </p>

      <p className="text-slate-500">
        {isAnalyzing ? "75%" : "100%"}
      </p>

    </div>
  </div>
</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <SectionDivider glowColor="#a855f7" />

        {/* FEATURES */}

        <section
          id="features"

          className="px-6 py-32 bg-black border-y border-white/5 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full" />
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Powerful Features
              </h2>

              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                AI powered document understanding for everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: FileText,
                  title: "Medical Report Analysis",
                  desc: "Understand medical reports easily.",
                },

                {
                  icon: Search,
                  title: "Smart OCR Scanner",
                  desc: "Extract text from photos instantly.",
                },

                {
                  icon: Zap,
                  title: "Instant AI Summary",
                  desc: "Quick summaries of long documents.",
                },

                {
                  icon: ShieldCheck,
                  title: "Privacy Focused",
                  desc: "Files are not permanently stored.",
                },

                {
                  icon: Database,
                  title: "PDF Upload Support",
                  desc: "Upload and analyze PDFs quickly.",
                },

                {
                  icon: Cpu,
                  title: "AI Insights",
                  desc: "Automatically highlights important points.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}

                  initial={{ opacity: 0, y: 30 }}

                  whileInView={{ opacity: 1, y: 0 }}

                  viewport={{ once: true }}

                  transition={{ delay: i * 0.1 }}

                  className="bg-slate-900/40 border border-white/5 rounded-3xl p-8"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>

                  <h3 className="text-xl font-bold mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <SectionDivider glowColor="#06b6d4" />

        {/* SECURITY */}

        <section
          id="security"

          className="px-6 py-32 bg-slate-950 border-y border-white/5 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Your Data is Safe
              </h2>

              <p className="text-slate-400">
                Your documents are never permanently stored.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: EyeOff,
                  title: "Private Analysis",
                  desc: "AI processes your document securely.",
                },

                {
                  icon: CloudOff,
                  title: "No Data Storage",
                  desc: "Files are not saved on servers.",
                },

                {
                  icon: Lock,
                  title: "Safe & Secure",
                  desc: "High-level protection for your information.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}

                  whileHover={{ y: -10 }}

                  className="p-8 rounded-3xl bg-slate-800/30 border border-white/5 text-center"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="text-primary w-8 h-8" />
                  </div>

                  <h3 className="text-xl font-bold mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}