// ============================================================
// LandingPage — Retail AI Portal
// Editorial landing in the style of agents.snsihub.ai
// Clean, warm off-white background, bold editorial typography
// Two accelerators: Product Search + Product Recommendation
// CTA: "ENTER PLATFORM →" → navigates to /home
// ============================================================

import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Search, Sparkles,
  Zap, Brain, Shield, CheckCircle, ChevronRight,
} from 'lucide-react';

const ECOSYSTEM_ITEMS = [
  { label: 'Vector Search', icon: '⚡' },
  { label: 'Delta Lake', icon: '🔷' },
  { label: 'Model Serving', icon: '🤖' },
  { label: 'MLflow', icon: '📊' },
  { label: 'Unity Catalog', icon: '🛡️' },
  { label: 'SQL Warehouse', icon: '🗄️' },
  { label: 'Foundation Models', icon: '🧠' },
  { label: 'AutoML', icon: '✨' },
];

const STEPS = [
  {
    num: '01',
    title: 'Natural Language Query',
    desc: 'Customer types what they\'re looking for in plain English — no exact keywords needed.',
  },
  {
    num: '02',
    title: 'BGE Embedding + Vector Search',
    desc: 'Query is embedded using BGE models, then Databricks Vector Search finds the most semantically similar products.',
  },
  {
    num: '03',
    title: 'Ranked Results Delivered',
    desc: 'Top products are returned with similarity scores, enriched with catalog metadata, and displayed instantly.',
  },
];

const ACCELERATORS = [
  {
    icon: Search,
    tag: 'ACCELERATOR 01',
    title: 'AI Product Search',
    desc: 'Vector similarity search powered by Databricks BGE embeddings. Understands intent, not just keywords. Returns semantically relevant products from your entire catalog in under 2 seconds.',
    features: ['Natural language queries', 'BGE vector embeddings', 'Similarity scoring', 'No-match fallback handling'],
    accent: '#4f46e5',
    accentBg: '#eef2ff',
  },
  {
    icon: Sparkles,
    tag: 'ACCELERATOR 02',
    title: 'AI Product Recommendation',
    desc: 'Context-aware recommendation engine on Databricks Model Serving. Personalizes in real-time based on session activity, purchase history, and browsing patterns.',
    features: ['Session-aware personalization', 'Multiple relationship types', 'Real-time context signals', 'Cold-start support'],
    accent: '#7e22ce',
    accentBg: '#faf5ff',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleEnter = () => navigate('/home');

  return (
    <div className="landing-page">

      {/* ── Navigation ────────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#1A1A1A' }}
            >
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">Retail AI Portal</p>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Powered by Databricks</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleEnter}
              className="landing-btn-primary"
              id="landing-nav-enter-btn"
            >
              ENTER PLATFORM <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 lg:pb-24">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">

          {/* Left */}
          <div className="flex-1 max-w-2xl">
            <p className="landing-section-tag mb-5">THE RETAIL AI ACCELERATOR</p>

            <h1 className="landing-hero-heading mb-6">
              Discover products<br />
              <span style={{ color: '#4f46e5' }}>the intelligent way.</span>
            </h1>

            <p className="text-lg text-slate-600 mb-3 leading-relaxed max-w-lg">
              Search in natural language. Get AI-powered recommendations.
            </p>
            <p className="text-base text-slate-500 mb-10 leading-relaxed max-w-lg">
              Built on Databricks Vector Search and Model Serving — an enterprise-grade accelerator
              demonstrating the full power of AI-driven retail discovery.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                id="landing-hero-enter-btn"
                onClick={handleEnter}
                className="landing-btn-primary"
              >
                ENTER PLATFORM <ArrowRight size={14} />
              </button>
              <button
                id="landing-hero-howit-btn"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="landing-btn-secondary"
              >
                SEE HOW IT WORKS
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-5 mt-10 pt-8 border-t border-[#E8E6E0]">
              {[
                { icon: Zap, text: 'Sub-2s search latency' },
                { icon: Shield, text: 'Enterprise governed' },
                { icon: Brain, text: 'BGE embeddings' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: decorative product search card */}
          <div className="w-full lg:w-96 shrink-0">
            <div
              className="landing-card p-0 overflow-hidden animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              {/* Card header */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E8E6E0]">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  VECTOR SEARCH · LIVE
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-600 font-semibold">Active</span>
                </span>
              </div>

              {/* Search input mockup */}
              <div className="p-5 space-y-3">
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8]"
                >
                  <Search size={15} className="text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-500">wireless headphones under ₹15,000</span>
                  <span className="ml-auto text-[10px] text-slate-300 font-mono">↵</span>
                </div>

                {/* Fake result cards */}
                {[
                  { name: 'Sony WH-1000XM5', brand: 'Sony', score: '0.94', price: '₹ 14,990' },
                  { name: 'Bose QuietComfort 45', brand: 'Bose', score: '0.91', price: '₹ 12,999' },
                  { name: 'JBL Tune 770NC', brand: 'JBL', score: '0.88', price: '₹ 8,999' },
                ].map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#E8E6E0] bg-white animate-fade-in"
                    style={{ animationDelay: `${400 + i * 100}ms` }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-base">🎧</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-400">{r.brand}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-800 font-mono">{r.price}</p>
                      <p className="text-[10px] text-indigo-500 font-mono">sim: {r.score}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">3 of 48 results · 1.3s</span>
                  <span className="text-[10px] font-semibold text-indigo-600">View all results →</span>
                </div>
              </div>
            </div>

            {/* Status badge below card */}
            <div className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E8E6E0] inline-flex w-full justify-center">
              <CheckCircle size={13} className="text-green-500" />
              <span className="text-xs text-slate-600 font-medium">
                Databricks Vector Search · Connected
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── "Goodbye, complex search." Section ────────────────────── */}
      <section
        className="border-t border-[#E8E6E0]"
        style={{ background: '#FFFFFF' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

            {/* Left */}
            <div className="flex-1 max-w-lg">
              <p className="landing-section-tag mb-5">THE UPGRADE</p>
              <h2
                className="text-4xl sm:text-5xl font-800 leading-tight mb-6 tracking-tight"
                style={{ fontWeight: 800, color: '#1A1A1A' }}
              >
                Goodbye,<br />keyword limitations.
              </h2>
              <p className="text-base text-slate-600 mb-8 leading-relaxed">
                Traditional keyword search misses intent. Retail AI uses vector embeddings to understand what customers <em>mean</em> — not just what they type.
              </p>

              <div className="space-y-4">
                {[
                  { num: '01', title: 'SEMANTIC UNDERSTANDING', desc: 'Understands "comfortable office chair for long hours" without exact keyword matches.' },
                  { num: '02', title: 'ZERO CONFIGURATION CATALOG', desc: 'No manual tagging required. Embeddings are generated automatically from product data.' },
                  { num: '03', title: 'INSTANT PERSONALIZATION', desc: 'Session signals flow into recommendations in real-time, improving with every interaction.' },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-4 p-4 rounded-xl border border-[#E8E6E0] bg-[#FAFAF8]">
                    <span className="text-xs font-bold text-slate-300 font-mono shrink-0 mt-0.5">
                      {item.num}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 tracking-wider uppercase mb-1">{item.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: comparison card */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="landing-card p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Search Comparison
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">Keyword Search</p>
                    <div className="space-y-2">
                      {['Exact match only', 'Misses synonyms', 'No context awareness', 'Manual tagging needed'].map((x) => (
                        <div key={x} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-[10px]">✕</span>
                          <span className="text-xs text-slate-500">{x}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 mb-2">Retail AI Search</p>
                    <div className="space-y-2">
                      {['Semantic intent matching', 'Understands context', 'Handles typos & variants', 'Auto-embedding pipeline'].map((x) => (
                        <div key={x} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-[10px]">✓</span>
                          <span className="text-xs font-medium text-slate-700">{x}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Databricks Ecosystem ──────────────────────────────────── */}
      <section
        className="border-t border-[#E8E6E0]"
        style={{ background: '#F7F5F2' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="landing-section-tag text-center mb-3">POWERED BY</p>
          <h2
            className="text-2xl font-bold text-center mb-8"
            style={{ color: '#1A1A1A' }}
          >
            Built on the Databricks Data Intelligence Platform.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {ECOSYSTEM_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white border border-[#E8E6E0] shadow-sm hover:shadow-md transition-shadow cursor-default"
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-xs font-semibold text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Accelerators Section ──────────────────────────────────── */}
      <section
        id="accelerators"
        className="border-t border-[#E8E6E0]"
        style={{ background: '#FFFFFF' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
          <p className="landing-section-tag text-center mb-3">WHAT'S INCLUDED</p>
          <h2
            className="text-3xl sm:text-4xl font-800 text-center mb-12 tracking-tight"
            style={{ fontWeight: 800, color: '#1A1A1A' }}
          >
            Two accelerators, one platform.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ACCELERATORS.map((acc, i) => {
              const Icon = acc.icon;
              return (
                <div
                  key={i}
                  className="landing-card p-7 hover:shadow-lg transition-shadow"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: acc.accentBg }}
                  >
                    <Icon size={20} style={{ color: acc.accent }} />
                  </div>
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: acc.accent }}>
                    {acc.tag}
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{acc.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">{acc.desc}</p>
                  <ul className="space-y-2">
                    {acc.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-xs text-slate-600">
                        <ChevronRight size={13} style={{ color: acc.accent }} className="shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-t border-[#E8E6E0]"
        style={{ background: '#F7F5F2' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
          <p className="landing-section-tag text-center mb-3">HOW IT WORKS</p>
          <h2
            className="text-3xl sm:text-4xl font-800 text-center mb-3 tracking-tight"
            style={{ fontWeight: 800, color: '#1A1A1A' }}
          >
            From a simple idea<br />to production-ready AI.
          </h2>
          <p className="text-base text-slate-500 text-center mb-12 max-w-lg mx-auto leading-relaxed">
            The entire search pipeline runs on Databricks — from ingestion to serving.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%+12px)] w-6 border-t border-dashed border-slate-300" />
                )}
                <div className="landing-card p-6 h-full">
                  <p className="text-3xl font-black text-slate-100 mb-4 font-mono">{step.num}</p>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section className="border-t border-[#E8E6E0]" style={{ background: '#1A1A1A' }}>
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4">
            READY TO EXPLORE
          </p>
          <h2
            className="text-3xl sm:text-4xl font-800 text-white mb-4 tracking-tight"
            style={{ fontWeight: 800 }}
          >
            Ready to turn your products into<br />
            an AI-powered discovery experience?
          </h2>
          <p className="text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
            This accelerator is fully wired to your Databricks workspace. Enter the platform and start exploring AI search and recommendations today.
          </p>
          <button
            id="landing-cta-enter-btn"
            onClick={handleEnter}
            className="inline-flex items-center gap-2 h-14 px-10 rounded-lg bg-white text-slate-900 font-bold text-sm uppercase tracking-wider hover:bg-slate-100 transition-colors"
          >
            ENTER PLATFORM <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E8E6E0]" style={{ background: '#F7F5F2' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Retail AI Portal</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">Powered by Databricks</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-400">Built with Vector Search · Model Serving · FastAPI · React</span>
          </div>
          <span className="text-xs text-slate-400">© 2026 Retail AI Accelerator</span>
        </div>
      </footer>

    </div>
  );
}
