import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import ProductPage from './pages/ProductPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import Header from './components/Header';
import Footer from './components/Footer';
import { trackVisit } from './utils/analytics';

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isProductPage = location.pathname.startsWith('/produit');

  // Track page visits (only for public pages, not admin)
  useEffect(() => {
    if (!isAdminPage) {
      trackVisit(location.pathname);
    }
  }, [location.pathname, isAdminPage]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && !isProductPage && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/produit/:slug" element={<ProductPage />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Routes>
      </main>
      {!isAdminPage && !isProductPage && <Footer />}
    </div>
  );
}

export default App;

