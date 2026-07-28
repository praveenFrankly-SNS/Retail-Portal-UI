import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage from '@/pages/LandingPage'
import { HomePage } from '@/pages/customer/HomePage'
import { SearchPage } from '@/pages/customer/SearchPage'
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage'
import { CatalogPage } from '@/pages/customer/CatalogPage'
import { CartPage } from '@/pages/customer/CartPage'
import { RecommendationsPage } from '@/pages/customer/RecommendationsPage'
import { ProfilePage } from '@/pages/customer/ProfilePage'
import { DemoLabPage } from '@/pages/customer/DemoLabPage'
import { MainLayout } from '@/components/layout/MainLayout'
import { Sparkles } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Landing page — entry point, no auth required ─── */}
          <Route path="/"            element={<LandingPage />} />

          {/* ── Main platform pages ────────────────────────── */}
          <Route path="/home"             element={<HomePage />} />
          <Route path="/search"           element={<SearchPage />} />
          <Route path="/catalog"          element={<CatalogPage />} />
          <Route path="/products/:id"     element={<ProductDetailPage />} />
          <Route path="/cart"             element={<CartPage />} />
          <Route path="/recommendations"  element={<RecommendationsPage />} />
          <Route path="/profile"          element={<ProfilePage />} />
          <Route path="/demo-lab"         element={<DemoLabPage />} />
          <Route path="/monitoring"       element={<MonitoringPlaceholder />} />
          <Route path="/about"            element={<AboutPage />} />

          {/* ── Catch-all → landing ─────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function MonitoringPlaceholder() {
  return (
    <MainLayout showRightSidebar={false}>
      <div className="empty-state">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center">
          <Sparkles size={28} className="text-primary-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Monitoring Dashboard</p>
          <p className="text-sm text-slate-500 mt-1">System metrics, latency tracking and index health — coming soon.</p>
        </div>
      </div>
    </MainLayout>
  )
}

function AboutPage() {
  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Sparkles size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">Retail AI Portal</h1>
        <p className="text-slate-500 text-base mb-4 leading-relaxed">
          An enterprise-grade accelerator demonstrating AI-powered Product Search and
          Product Recommendation, built on Databricks.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-8 text-left">
          {[
            { label: 'AI Search',          desc: 'Vector similarity search powered by Databricks BGE embeddings' },
            { label: 'AI Recommendations', desc: 'Context-aware recommendation engine on Databricks Model Serving' },
            { label: 'Cold-Start Demo',    desc: 'Upload a product, generate embeddings, make it instantly searchable' },
            { label: 'Real-time Context',  desc: 'Session tracking drives instant recommendation personalization' },
          ].map(({ label, desc }) => (
            <div key={label} className="card p-4">
              <p className="font-bold text-slate-900 text-sm">{label}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-8">
          Built with Databricks Vector Search · Model Serving · Foundation Model APIs · FastAPI · React
        </p>
      </div>
    </MainLayout>
  )
}

export default App
