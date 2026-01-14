import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

function AdminLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ordersCount, setOrdersCount] = useState(null);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch orders count for badge
  useEffect(() => {
    const fetchOrdersCount = async () => {
      try {
        const response = await axios.get('/api/admin/orders', {
          headers: {
            'x-admin-key': 'ZENDO_ADMIN_2026',
          },
          params: {
            limit: 1,
          },
        });
        if (response.data.success && response.data.pagination) {
          setOrdersCount(response.data.pagination.total);
        }
      } catch (error) {
        console.error('Error fetching orders count:', error);
      }
    };
    fetchOrdersCount();
  }, [location.pathname]);

  const menuItems = [
    {
      name: 'Accueil',
      path: '/admin/dashboard',
      icon: '🏠',
    },
    {
      name: 'Commandes',
      path: '/admin/orders',
      icon: '🛒',
      badge: ordersCount,
    },
    {
      name: 'Produits',
      path: '/admin/products',
      icon: '📦',
    },
    {
      name: 'Clients',
      path: '/admin/customers',
      icon: '👤',
    },
    {
      name: 'Marketing',
      path: '/admin/marketing',
      icon: '📈',
    },
    {
      name: 'Réductions',
      path: '/admin/discounts',
      icon: '⚙️',
    },
    {
      name: 'Contenu',
      path: '/admin/content',
      icon: '📖',
    },
    {
      name: 'Analyses',
      path: '/admin/analytics',
      icon: '📊',
    },
  ];

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header Bar - Dark */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: Logo & Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="p-2 rounded hover:bg-gray-800 transition-colors text-gray-300"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen || !sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">zendo</span>
              <span className="text-gray-400 text-sm">Hiver '26</span>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">Q</span>
              </div>
              <input
                type="text"
                placeholder="Rechercher"
                className="w-full pl-8 pr-20 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-xs text-gray-500">CTRL K</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Site
            </Link>
            <button className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-semibold">
              ZCS
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Dark */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-30 bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        <div className={`w-64 h-full overflow-y-auto ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <nav className="p-3">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-600 text-white rounded-full min-w-[1.5rem] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Separator */}
            <div className="my-3 border-t border-gray-800"></div>

            {/* Sales Channels */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Canaux de vente</p>
              <Link
                to="/admin/channels/online-store"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <span className="text-lg">🏪</span>
                <span>Boutique en ligne</span>
              </Link>
              <Link
                to="/admin/channels/social"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <span className="text-lg">∞</span>
                <span>Facebook & Instagram</span>
                <span className="ml-auto w-2 h-2 bg-gray-600 rounded-full"></span>
              </Link>
            </div>

            {/* Separator */}
            <div className="my-3 border-t border-gray-800"></div>

            {/* Apps */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Applications</p>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300">
                <span className="text-lg">☑</span>
                <span>Judge.me Reviews</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300">
                <span className="text-lg">☰</span>
                <span>EasySell COD Form</span>
                <span className="ml-auto w-2 h-2 bg-gray-600 rounded-full"></span>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-14 bottom-0 left-0 z-40 bg-gray-900 border-r border-gray-800 w-64 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-3 h-full overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-600 text-white rounded-full min-w-[1.5rem] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-14 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <div className="min-h-screen bg-gray-100">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
