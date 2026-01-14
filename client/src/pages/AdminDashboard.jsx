import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getFirstWord } from '../utils/format';

function AdminDashboard() {
  const [stats, setStats] = useState({
    visits: { total: 0, change: 0, sparkline: [] },
    revenue: { total: 0, change: 0 },
    orders: { total: 0, change: 0, pending: 0, sparkline: [] },
    conversionRate: 0,
    customers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [timeRange, setTimeRange] = useState('30 derniers jours');
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [days]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/stats', {
        headers: {
          'x-admin-key': 'ZENDO_ADMIN_2026',
        },
        params: {
          days: days,
        },
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // En cas d'erreur, garder les valeurs par défaut (0)
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get('/api/admin/orders', {
        headers: {
          'x-admin-key': 'ZENDO_ADMIN_2026',
        },
        params: {
          limit: 5,
          sort: '-createdAt',
        },
      });

      if (response.data.success) {
        setRecentOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const handleTimeRangeChange = (newDays) => {
    setDays(newDays);
    const labels = {
      7: '7 derniers jours',
      30: '30 derniers jours',
      90: '90 derniers jours',
      365: '1 an',
    };
    setTimeRange(labels[newDays] || `${newDays} derniers jours`);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0 FCFA';
    if (typeof price === 'number') {
      if (price >= 1000000) {
        return `${(price / 1000000).toFixed(1)} M FCFA`;
      }
      return `${price.toLocaleString('fr-FR')} FCFA`;
    }
    return price;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} K`;
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatChange = (change) => {
    if (change === 0) return '—';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Filter Bar */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTimeRangeChange(7)}
              className={`px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-colors ${
                days === 7
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              7j
            </button>
            <button
              onClick={() => handleTimeRangeChange(30)}
              className={`px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-colors ${
                days === 30
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              30j
            </button>
            <button
              onClick={() => handleTimeRangeChange(90)}
              className={`px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-colors ${
                days === 90
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              90j
            </button>
            <button
              onClick={() => handleTimeRangeChange(365)}
              className={`px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-colors ${
                days === 365
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              1 an
            </button>
          </div>
          <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <option>Tous les canaux</option>
            <option>Boutique en ligne</option>
            <option>Facebook & Instagram</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Message si aucune donnée */}
            {(!stats.visits?.total || stats.visits.total === 0) && (!stats.orders?.total || stats.orders.total === 0) && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">Aucune donnée disponible</p>
                    <p className="text-xs text-blue-700">
                      Les statistiques apparaîtront automatiquement lorsque des visiteurs utiliseront le site et passeront des commandes.
                      Pour générer des données de test, exécutez : <code className="bg-blue-100 px-1 rounded">npm run seed:data</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Performance Metrics Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Visites */}
                  <div className="border-r border-gray-200 pr-6 last:border-r-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Visites</p>
                      {stats.visits.change !== 0 && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${getChangeColor(stats.visits.change)}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stats.visits.change > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                          </svg>
                          {Math.abs(stats.visits.change)}%
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {formatNumber(stats.visits?.total || 0)}
                    </p>
                    {stats.visits?.sparkline && stats.visits.sparkline.length > 0 && stats.visits.sparkline.some(v => v > 0) && (
                      <div className="h-8 flex items-end gap-0.5">
                        {stats.visits.sparkline.map((value, i) => {
                          const maxValue = Math.max(...stats.visits.sparkline.filter(v => v > 0), 1);
                          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-blue-500 rounded-t min-h-[2px]"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            />
                          );
                        })}
                      </div>
                    )}
                    {(!stats.visits?.sparkline || stats.visits.sparkline.length === 0 || !stats.visits.sparkline.some(v => v > 0)) && (
                      <div className="h-8 flex items-center text-xs text-gray-400">
                        Aucune donnée
                      </div>
                    )}
                  </div>

                  {/* Ventes totales */}
                  <div className="border-r border-gray-200 pr-6 last:border-r-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Ventes totales</p>
                      {stats.revenue.change !== 0 && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${getChangeColor(stats.revenue.change)}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stats.revenue.change > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                          </svg>
                          {Math.abs(stats.revenue.change)}%
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.revenue?.total || 0)}</p>
                    {stats.revenue?.total >= 1000000 && (
                      <p className="text-xs text-gray-500 mt-1">{(stats.revenue.total / 1000000).toFixed(1)} M FCFA</p>
                    )}
                  </div>

                  {/* Commandes */}
                  <div className="border-r border-gray-200 pr-6 last:border-r-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Commandes</p>
                      {stats.orders.change !== 0 && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${getChangeColor(stats.orders.change)}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stats.orders.change > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                          </svg>
                          {Math.abs(stats.orders.change)}%
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{stats.orders.total || 0}</p>
                    {stats.orders.sparkline && stats.orders.sparkline.length > 0 && (
                      <div className="h-8 flex items-end gap-0.5">
                        {stats.orders.sparkline.map((value, i) => {
                          const maxValue = Math.max(...stats.orders.sparkline.filter(v => v > 0), 1);
                          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-blue-500 rounded-t min-h-[2px]"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Taux de conversion */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Taux de conversion</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {(stats.conversionRate || 0) > 0 ? `${stats.conversionRate}%` : '—'}
                    </p>
                    {(stats.conversionRate || 0) > 0 && (
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
                        />
                      </div>
                    )}
                    {(stats.conversionRate || 0) === 0 && (
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-300" style={{ width: '0%' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Link
                to="/admin/orders?status=new,pending,called"
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {(stats.orders?.pending || 0) > 0 ? `${stats.orders.pending}+` : 'Aucune'} commande{(stats.orders?.pending || 0) > 1 ? 's' : ''} à traiter
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Commandes nécessitant une attention</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {(stats.orders?.pending || 0) > 0 ? `${stats.orders.pending}+` : 'Aucun'} paiement{(stats.orders?.pending || 0) > 1 ? 's' : ''} à saisir
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Paiements en attente de capture</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <p className="text-lg font-semibold text-gray-900 mb-4">
                Bonsoir ! C'est parti.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Demandez quelque chose..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Improvement Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                        <circle cx="12" cy="12" r="10" fill="currentColor" className="text-blue-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)' }} />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">1 sur 4 tâches effectuées</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Améliorez votre taux de conversion
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Augmentez le pourcentage de visiteurs qui achètent quelque chose dans votre boutique en ligne.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Prochaine leçon:</span>
                    <span className="font-medium">Automatisez vos paniers abandonnés</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  Reprendre le guide
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Commandes récentes</h2>
                  <Link
                    to="/admin/orders"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Voir toutes →
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      to="/admin/orders"
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                              #{order._id?.slice(-4).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{order.name}</p>
                              <p className="text-xs text-gray-500">{getFirstWord(order.productName)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(order.totalPrice || order.productPrice)}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
