// ============================================================
// DemoLabPage — Retail AI Portal (WF-11 through WF-14)
// Multi-step AI Demo Lab wizard:
//   Step 1 (WF-11): Dashboard — vector index status, recent uploads
//   Step 2 (WF-12): Upload Product — form + product preview
//   Step 3 (WF-13): AI Processing — pipeline steps with live logs
//   Step 4 (WF-14): Cold-Start Demo — product in search & recommendations
// ============================================================

import { useState, useEffect, useRef } from 'react';
import {
  FlaskConical, UploadCloud, Search, Sparkles, CheckCircle,
  AlertTriangle, Activity, Database, BarChart2, ArrowRight,
  Brain, Layers, RefreshCcw, FileText,
  Play, ChevronRight, Package, Loader2,
  Zap,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';

type Step = 1 | 2 | 3 | 4;

type ProcessingPipelineStep = {
  id: string;
  label: string;
  sub: string;
  icon: React.ElementType;
  status: 'waiting' | 'running' | 'done' | 'error';
  ms?: number;
};

const PIPELINE_STEPS: ProcessingPipelineStep[] = [
  { id: 'extract',  label: 'Feature Extraction',         sub: 'Extracting product attributes',           icon: FileText,  status: 'waiting' },
  { id: 'normalize',label: 'Text Normalization',         sub: 'Cleaning and structuring product text',   icon: Layers,    status: 'waiting' },
  { id: 'embed',    label: 'Embedding Generation',       sub: 'Generating 1024-dim vector embeddings',   icon: Brain,     status: 'waiting' },
  { id: 'update',   label: 'Vector Index Update',        sub: 'Inserting into Databricks Vector Search', icon: Database,  status: 'waiting' },
  { id: 'refresh',  label: 'Index Refresh',              sub: 'Finalizing index for search & recs',      icon: RefreshCcw,status: 'waiting' },
];

const RECENT_UPLOADS = [
  { name: 'JBL Charge 5 Speaker',         status: 'Active',   time: '2 hours ago',  category: 'Audio' },
  { name: 'Ergonomic Mesh Chair',          status: 'Active',   time: '5 hours ago',  category: 'Furniture' },
  { name: 'Anker 65W USB-C Charger',       status: 'Active',   time: '1 day ago',    category: 'Accessories' },
  { name: 'Samsung Galaxy Tab S9',         status: 'Active',   time: '2 days ago',   category: 'Smart Devices' },
];

const CATEGORY_OPTIONS = [
  'Audio & Headphones', 'Computers & Laptops', 'Smart Devices', 'Monitors',
  'Accessories', 'Home Office', 'Cameras', 'Gaming', 'Smart Home', 'Wearables',
];

const STATUS_COLOR: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Processing: 'bg-blue-100 text-blue-700',
  Error: 'bg-red-100 text-red-700',
};

export function DemoLabPage() {
  const navigate = useNavigate();
  const { activeCustomer: _activeCustomer } = useUserStore();

  const [step, setStep] = useState<Step>(1);

  // Step 2: Product form
  const [productName,  setProductName]  = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productCat,   setProductCat]   = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDesc,  setProductDesc]  = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formError, setFormError]       = useState('');

  // Step 3: Processing pipeline
  const [pipelineSteps, setPipelineSteps]   = useState<ProcessingPipelineStep[]>(PIPELINE_STEPS);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineDone,    setPipelineDone]    = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [_currentStepIdx, setCurrentStepIdx]  = useState(-1);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Step 4: Demo results
  const [searchSimResults, setSearchSimResults] = useState([
    { rank: 1, product: productName || 'Your Product', score: 0.97, reason: 'Exact match by title' },
    { rank: 2, product: 'Sony WH-1000XM5', score: 0.82, reason: 'Similar category and features' },
    { rank: 3, product: 'Bose QuietComfort 45', score: 0.78, reason: 'Alternative in premium audio' },
  ]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runPipeline = async () => {
    if (pipelineRunning || pipelineDone) return;
    setPipelineRunning(true);
    const stepsArr = [...PIPELINE_STEPS];

    for (let i = 0; i < stepsArr.length; i++) {
      setCurrentStepIdx(i);

      // Set running
      setPipelineSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'running' } : s
      ));

      const messages: Record<string, string[]> = {
        extract:   ['Parsing product JSON payload...', 'Extracting: name, brand, category, price, description...', 'Product features identified: ✓'],
        normalize: ['Lowercasing and tokenizing text...', 'Removing stop words and HTML...', 'Text normalized successfully: ✓'],
        embed:     ['Calling Databricks Foundation Model API...', 'Model: databricks-bge-large-en', 'Embedding shape: [1024] generated: ✓'],
        update:    ['Connecting to Databricks Vector Search endpoint...', 'Inserting document into vector index...', 'Document indexed with ID: DEMO-' + Math.random().toString(36).slice(2,7).toUpperCase()],
        refresh:   ['Triggering online index refresh...', 'Index now includes your product...', '✅ Product is now searchable and recommendable!'],
      };

      const msDelay = [1200, 900, 2000, 1500, 1000][i];
      const msgs = messages[stepsArr[i].id] || [];

      for (const msg of msgs) {
        await new Promise(r => setTimeout(r, msDelay / msgs.length));
        addLog(msg);
      }

      setPipelineSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'done', ms: msDelay } : s
      ));
    }

    setPipelineRunning(false);
    setPipelineDone(true);
    addLog('🎉 All pipeline steps completed. Your product is live in the AI system!');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productBrand || !productCat || !productPrice) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormError('');
    setSearchSimResults(prev => [
      { rank: 1, product: productName, score: 0.97, reason: 'Exact match by title' },
      ...prev.slice(1),
    ]);
    setStep(3);
  };

  const stepBreadcrumbs = [
    { n: 1, label: 'Dashboard' },
    { n: 2, label: 'Upload Product' },
    { n: 3, label: 'AI Processing' },
    { n: 4, label: 'Cold-Start Demo' },
  ];

  return (
    <MainLayout showRightSidebar={false}>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <FlaskConical size={20} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">AI Demo Lab</h1>
            <p className="text-sm text-slate-500">See how new products become searchable and recommendable</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          <AlertTriangle size={14} className="text-amber-600" />
          <span className="text-xs font-bold text-amber-700">Demo Environment — No data is persisted</span>
        </div>
      </div>

      {/* ── Step Breadcrumb ──────────────────────────────────── */}
      <div className="flex items-center gap-0 mb-8">
        {stepBreadcrumbs.map(({ n, label }, idx) => (
          <div key={n} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                step === n
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                  : step > n
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
              onClick={() => { if (step > n) setStep(n as Step); }}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                step === n ? 'bg-white/20' : step > n ? 'bg-green-200' : 'bg-slate-200'
              }`}>
                {step > n ? <CheckCircle size={12} className="text-green-700" /> : n}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {idx < stepBreadcrumbs.length - 1 && (
              <ChevronRight size={16} className="text-slate-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          STEP 1 — Dashboard (WF-11)
      ═══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-6">

          {/* Vector Index Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Database, label: 'Vector Index Status', value: 'Healthy',   sub: 'Last refresh: 2 min ago',    color: 'text-green-600 bg-green-50', badge: 'Live' },
              { icon: Package,  label: 'Products in Index',   value: '1,248',      sub: '+3 added this week',          color: 'text-blue-600 bg-blue-50',   badge: null },
              { icon: Zap,      label: 'Search Latency',      value: '< 150ms',   sub: 'Average query response time', color: 'text-purple-600 bg-purple-50',badge: null },
              { icon: Brain,    label: 'Embeddings Model',    value: 'BGE-Large',  sub: 'databricks-bge-large-en',    color: 'text-amber-600 bg-amber-50',  badge: 'Active' },
            ].map(({ icon: Icon, label, value, sub, color, badge }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                  </div>
                  {badge && (
                    <span className="bg-green-100 text-green-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{badge}</span>
                  )}
                </div>
                <p className="text-xl font-black text-slate-900">{value}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main CTA Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-primary-50 via-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-5">
                <Brain size={200} />
              </div>
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                  <FlaskConical size={12} /> New Feature
                </span>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Cold-Start Product Demo</h2>
                <p className="text-slate-600 leading-relaxed text-sm mb-5">
                  See the entire AI pipeline in action. Upload a product, watch it get embedded, indexed,
                  and immediately become searchable and recommendable — all powered by Databricks.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { step: '1', icon: UploadCloud, text: 'Define Product' },
                    { step: '2', icon: Brain,       text: 'Generate Embeddings' },
                    { step: '3', icon: Database,    text: 'Index Update' },
                    { step: '4', icon: Search,      text: 'Instantly Searchable' },
                  ].map(({ step: s, icon: Icon, text }) => (
                    <div key={s} className="text-center bg-white/80 rounded-xl p-3 border border-white shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-2">
                        <Icon size={16} className="text-primary-600" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-700">{text}</p>
                    </div>
                  ))}
                </div>
                <button
                  id="start-demo-btn"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Start Demo Lab <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Available Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-black text-slate-900 mb-4">Available Actions</h3>
              <div className="space-y-2.5">
                {[
                  { icon: UploadCloud, label: 'Upload New Product',      sub: 'Add to embedding pipeline',  action: () => setStep(2) },
                  { icon: RefreshCcw,  label: 'Refresh Vector Index',    sub: 'Force index rebuild',          action: () => {} },
                  { icon: Search,      label: 'Test Search Endpoint',    sub: 'Run test query against index',action: () => navigate('/search?q=demo+product') },
                  { icon: BarChart2,   label: 'View Metrics Dashboard',  sub: 'Latency, indexing stats',     action: () => navigate('/monitoring') },
                ].map(({ icon: Icon, label, sub, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                      <Icon size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-primary-700">{label}</p>
                      <p className="text-[10px] text-slate-500">{sub}</p>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 ml-auto group-hover:text-primary-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Uploads */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">Recent Demo Uploads</h3>
              <span className="text-[10px] text-slate-400">Simulated data — Demo only</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left pb-2">Product</th>
                    <th className="text-left pb-2">Category</th>
                    <th className="text-right pb-2">Uploaded</th>
                    <th className="text-right pb-2">Status</th>
                    <th className="text-right pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {RECENT_UPLOADS.map((row) => (
                    <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 text-xs font-bold text-slate-800">{row.name}</td>
                      <td className="py-3 text-xs text-slate-500">{row.category}</td>
                      <td className="py-3 text-xs text-slate-500 text-right">{row.time}</td>
                      <td className="py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-[10px] text-primary-600 font-bold hover:underline">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 2 — Upload Product (WF-12)
      ═══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-black text-slate-900 mb-1">Define Your Product</h2>
              <p className="text-sm text-slate-500 mb-6">
                Fill in the product details. This will be processed through the AI embedding pipeline.
              </p>

              {/* Upload area */}
              <div
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center mb-6 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={32} className="text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700 mb-1">
                  {uploadedFile ? uploadedFile.name : 'Drop product image here or click to upload'}
                </p>
                <p className="text-xs text-slate-500">Supports JPG, PNG, WebP up to 10MB</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                />
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Sony WH-1000XM6 Headphones"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productBrand}
                      onChange={(e) => setProductBrand(e.target.value)}
                      placeholder="e.g., Sony"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={productCat}
                      onChange={(e) => setProductCat(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary-400 bg-white"
                    >
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="e.g., 29990"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Product Description</label>
                  <textarea
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Describe the product in detail. The richer the description, the better the embeddings."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={12} /> {formError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-all shadow-md"
                  >
                    <Brain size={15} /> Run AI Pipeline <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Product Preview */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-24">
              <h3 className="text-sm font-black text-slate-900 mb-4">Product Preview</h3>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="aspect-square bg-slate-50 flex items-center justify-center">
                  {uploadedFile ? (
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt="Preview"
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="text-center">
                      <Package size={48} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Product image preview</p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-black text-slate-900 text-sm">{productName || 'Product Name'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{productBrand || 'Brand'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-base font-black text-slate-900">
                      {productPrice ? `₹${Number(productPrice).toLocaleString('en-IN')}` : '₹—'}
                    </span>
                  </div>
                  {productCat && (
                    <span className="mt-2 inline-block bg-primary-50 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {productCat}
                    </span>
                  )}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                    {productDesc || 'Product description will appear here...'}
                  </p>
                </div>
              </div>

              {/* What happens next */}
              <div className="mt-4 bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-black text-slate-700 mb-2">What happens next?</p>
                <div className="space-y-1.5">
                  {['Your product is sent to the AI pipeline', 'BGE embeddings are generated', 'Indexed in Databricks Vector Search', 'Now searchable and recommendable!'].map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="text-[10px] font-black text-primary-600 shrink-0 mt-0.5">{i + 1}.</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 3 — AI Processing (WF-13)
      ═══════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Pipeline steps */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">AI Processing Pipeline</h2>
                <p className="text-sm text-slate-500">Generating embeddings and updating the vector index</p>
              </div>
              {!pipelineRunning && !pipelineDone && (
                <button
                  onClick={runPipeline}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors shadow-md"
                >
                  <Play size={14} /> Run Pipeline
                </button>
              )}
              {pipelineRunning && (
                <div className="flex items-center gap-2 text-primary-600 font-bold text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </div>
              )}
              {pipelineDone && (
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-md"
                >
                  View Demo <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Steps timeline */}
            <div className="space-y-0">
              {pipelineSteps.map((s, idx) => {
                const Icon = s.icon;
                const isRunning = s.status === 'running';
                const isDone    = s.status === 'done';
                const _isWaiting = s.status === 'waiting';
                return (
                  <div key={s.id} className="flex gap-4">
                    {/* Line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isDone    ? 'bg-green-100 text-green-600' :
                        isRunning ? 'bg-primary-100 text-primary-600 animate-pulse' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? <CheckCircle size={18} /> : isRunning ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
                      </div>
                      {idx < pipelineSteps.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 ${isDone ? 'bg-green-300' : 'bg-slate-200'}`} style={{ minHeight: '24px' }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-6 ${idx === pipelineSteps.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-black ${isDone ? 'text-green-700' : isRunning ? 'text-primary-700' : 'text-slate-500'}`}>
                            {s.label}
                          </p>
                          <p className="text-xs text-slate-500">{s.sub}</p>
                        </div>
                        {isDone && (
                          <div className="text-right">
                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">✓ Done</span>
                            {s.ms && <p className="text-[9px] text-slate-400 mt-0.5">{s.ms}ms</p>}
                          </div>
                        )}
                        {isRunning && (
                          <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-full animate-pulse">Running...</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {pipelineDone && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <h3 className="text-sm font-black text-green-800">Pipeline Complete!</h3>
                </div>
                <p className="text-xs text-green-700 mb-3">
                  <strong>"{productName || 'Your Product'}"</strong> has been successfully processed. It's now searchable and will appear in AI recommendations.
                </p>
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
                >
                  View Cold-Start Demo <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Live Logs */}
          <div className="bg-slate-900 rounded-2xl p-4 flex flex-col" style={{ minHeight: '400px' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-green-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Pipeline Logs</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <p className="text-slate-500">$ Waiting for pipeline to start...</p>
              ) : (
                logs.map((log, i) => (
                  <p key={i} className={`${log.includes('✓') || log.includes('✅') || log.includes('🎉') ? 'text-green-400' : 'text-slate-300'}`}>
                    {log}
                  </p>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 4 — Cold-Start Demo (WF-14)
      ═══════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="space-y-6">

          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-green-800">
                "{productName || 'Your Product'}" is now live in the AI system!
              </h2>
              <p className="text-sm text-green-700 mt-0.5">
                This product is indexed and will appear in search results and AI recommendations.
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-green-600 font-bold">Total Pipeline Time</p>
              <p className="text-2xl font-black text-green-800">6.6s</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Search Simulation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Search size={18} className="text-primary-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Search Results (Simulated)</h3>
                  <p className="text-xs text-slate-500">Query: "{productName || 'Your Product'}"</p>
                </div>
              </div>
              <div className="space-y-3">
                {searchSimResults.map((r) => (
                  <div key={r.rank} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${r.rank === 1 ? 'border-primary-200 bg-primary-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${r.rank === 1 ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      #{r.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{r.product}</p>
                        {r.rank === 1 && <span className="bg-green-100 text-green-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>}
                      </div>
                      <p className="text-[10px] text-slate-500">{r.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-primary-600">{(r.score * 100).toFixed(0)}%</p>
                      <p className="text-[9px] text-slate-400">similarity</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation Simulation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-primary-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Recommendation Results (Simulated)</h3>
                  <p className="text-xs text-slate-500">Your product in the AI recommendation engine</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Recommended For You (Home)',           score: 0.91, user: 'Frank', badge: 'BEST_MATCH' },
                  { label: 'Complete Your Setup (PDP)',           score: 0.88, user: 'Priya', badge: 'COMPLEMENTARY' },
                  { label: 'Frequently Bought Together (Cart)', score: 0.83, user: 'Daniel', badge: 'BUNDLE' },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-primary-50 hover:border-primary-100 transition-all">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                      <Sparkles size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{r.label}</p>
                      <p className="text-[10px] text-slate-500">For customer: {r.user}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-primary-600">{(r.score * 100).toFixed(0)}%</p>
                      <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">{r.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Embedding Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-900 mb-4">Embedding Visualization (Simulated)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Embedding Model',    value: 'databricks-bge-large-en' },
                { label: 'Vector Dimensions', value: '1,024' },
                { label: 'Similarity Metric', value: 'Cosine Similarity' },
                { label: 'Index Size (after)', value: '1,249 products' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-semibold">{label}</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setStep(1); setPipelineSteps(PIPELINE_STEPS); setPipelineDone(false); setLogs([]); setCurrentStepIdx(-1); setProductName(''); setProductBrand(''); setProductCat(''); setProductPrice(''); setProductDesc(''); }}
              className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCcw size={14} /> Run Another Demo
            </button>
            <button
              onClick={() => navigate('/search?q=' + encodeURIComponent(productName || 'product'))}
              className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-md"
            >
              <Search size={14} /> Test in Search
            </button>
            <button
              onClick={() => navigate('/recommendations')}
              className="flex items-center gap-2 px-5 py-3 border border-primary-200 text-primary-600 rounded-xl text-sm font-bold hover:bg-primary-50 transition-colors"
            >
              <Sparkles size={14} /> View Recommendations
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
