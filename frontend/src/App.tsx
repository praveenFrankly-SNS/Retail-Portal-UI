import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/customer/HomePage'
import { SearchPage } from '@/pages/customer/SearchPage'
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage'
import { CatalogPage } from '@/pages/customer/CatalogPage'
import { CartPage } from '@/pages/customer/CartPage'
import { RecommendationsPage } from '@/pages/customer/RecommendationsPage'
import { ProfilePage } from '@/pages/customer/ProfilePage'

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
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Demo Lab — Stage 3 */}
          <Route path="/demo-lab" element={<DemoLabPlaceholder />} />
          <Route path="/about" element={<AboutPlaceholder />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Temporary placeholders for Stage 3 pages
function DemoLabPlaceholder() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🧪</div>
        <h1 className="text-xl font-semibold text-gray-900">AI Demo Lab</h1>
        <p className="text-gray-500 mt-2">Coming in Stage 3 — Upload product → AI Processing → Cold-Start Demo</p>
      </div>
    </div>
  )
}

function AboutPlaceholder() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">Retail AI Portal</h1>
        <p className="text-gray-500 mt-2">Powered by Databricks — AI Search + Common-Sense Recommendations</p>
      </div>
    </div>
  )
}

export default App
