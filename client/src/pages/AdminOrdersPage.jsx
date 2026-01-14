import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getFirstWord } from '../utils/format';
import { api } from '../utils/api';

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-createdAt');

  useEffect(() => {
    fetchOrders();
    // Rafraîchir toutes les 30 secondes pour voir les nouvelles commandes
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [sortBy]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/orders', {
        headers: {
          'x-admin-key': 'ZENDO_ADMIN_2026',
        },
        params: {
          sort: sortBy,
        },
      });

      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone?.includes(searchQuery) ||
      order.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return price;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En traitement';
      case 'shipped':
        return 'Expédiée';
      case 'delivered':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'En attente';
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await api.patch(
        `/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'x-admin-key': 'ZENDO_ADMIN_2026',
          },
        }
      );

      if (response.data.success) {
        // Mettre à jour la commande dans la liste
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        // Mettre à jour la commande sélectionnée si c'est celle-ci
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        return true;
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      alert('Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  const updateOrder = async (orderId, orderData) => {
    try {
      const response = await api.put(
        `/api/admin/orders/${orderId}`,
        orderData,
        {
          headers: {
            'x-admin-key': 'ZENDO_ADMIN_2026',
          },
        }
      );

      if (response.data.success) {
        // Mettre à jour la commande dans la liste
        setOrders(orders.map(order => 
          order._id === orderId ? response.data.order : order
        ));
        // Mettre à jour la commande sélectionnée si c'est celle-ci
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(response.data.order);
        }
        setEditingOrder(null);
        return true;
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      alert('Erreur lors de la mise à jour de la commande');
      return false;
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      return;
    }

    try {
      console.log('🗑️  Suppression de la commande:', orderId);
      const response = await api.delete(`/api/admin/orders/${orderId}`, {
        headers: {
          'x-admin-key': 'ZENDO_ADMIN_2026',
        },
      });

      if (response.data.success) {
        console.log('✅ Commande supprimée avec succès');
        // Retirer la commande de la liste
        setOrders(orders.filter(order => order._id !== orderId));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(null);
        }
        // Retirer de la sélection
        const newSelected = new Set(selectedOrders);
        newSelected.delete(orderId);
        setSelectedOrders(newSelected);
        // Rafraîchir la liste pour être sûr
        fetchOrders();
        return true;
      }
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      console.error('Détails:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
      });
      
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la suppression de la commande';
      alert(`Erreur: ${errorMessage}`);
      return false;
    }
  };

  // Fonctions de sélection multiple
  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order._id)));
    }
  };

  const isAllSelected = filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length;
  const isSomeSelected = selectedOrders.size > 0 && selectedOrders.size < filteredOrders.length;

  // Actions en masse
  const bulkUpdateStatus = async (newStatus) => {
    if (selectedOrders.size === 0) return;

    const count = selectedOrders.size;
    const selectedIds = Array.from(selectedOrders);

    if (!window.confirm(`Changer le statut de ${count} commande(s) en "${getStatusLabel(newStatus)}" ?`)) {
      return;
    }

    try {
      const promises = selectedIds.map(orderId =>
        api.patch(
          `/api/admin/orders/${orderId}/status`,
          { status: newStatus },
          {
            headers: {
              'x-admin-key': 'ZENDO_ADMIN_2026',
            },
          }
        )
      );

      await Promise.all(promises);
      
      // Mettre à jour les commandes dans la liste
      setOrders(orders.map(order =>
        selectedIds.includes(order._id) ? { ...order, status: newStatus } : order
      ));
      
      // Vider la sélection
      setSelectedOrders(new Set());
      
      // Rafraîchir
      fetchOrders();
      
      alert(`${count} commande(s) mise(s) à jour avec succès`);
    } catch (err) {
      console.error('Erreur lors de la mise à jour en masse:', err);
      alert('Erreur lors de la mise à jour en masse');
    }
  };

  const bulkDelete = async () => {
    if (selectedOrders.size === 0) return;

    const count = selectedOrders.size;
    const selectedIds = Array.from(selectedOrders);

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${count} commande(s) ?`)) {
      return;
    }

    try {
      const promises = selectedIds.map(orderId =>
        api.delete(`/api/admin/orders/${orderId}`, {
          headers: {
            'x-admin-key': 'ZENDO_ADMIN_2026',
          },
        })
      );

      await Promise.all(promises);
      
      // Retirer les commandes de la liste
      setOrders(orders.filter(order => !selectedIds.includes(order._id)));
      
      // Fermer le modal si une commande sélectionnée était ouverte
      if (selectedOrder && selectedIds.includes(selectedOrder._id)) {
        setSelectedOrder(null);
      }
      
      // Vider la sélection
      setSelectedOrders(new Set());
      
      // Rafraîchir
      fetchOrders();
      
      alert(`${count} commande(s) supprimée(s) avec succès`);
    } catch (err) {
      console.error('Erreur lors de la suppression en masse:', err);
      alert('Erreur lors de la suppression en masse');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Commandes</h1>
              <p className="text-gray-600">Gérez toutes vos commandes en un seul endroit</p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm hover:shadow"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  Actualisation...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualiser
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrders.size > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {selectedOrders.size}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      {selectedOrders.size} commande(s) sélectionnée(s)
                    </p>
                    <button
                      onClick={() => setSelectedOrders(new Set())}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-0.5"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        bulkUpdateStatus(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  >
                    <option value="">Changer le statut...</option>
                    <option value="new">Nouvelle commande</option>
                    <option value="called">Appelé</option>
                    <option value="pending">En attente</option>
                    <option value="processing">En traitement</option>
                    <option value="in_delivery">En cours de livraison</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livré</option>
                    <option value="rescheduled">Reprogrammé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                  <button
                    onClick={bulkDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Supprimer ({selectedOrders.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-colors"
            >
              <option value="all">Tous les statuts</option>
              <option value="new">Nouvelle commande</option>
              <option value="called">Appelé</option>
              <option value="pending">En attente</option>
              <option value="processing">En traitement</option>
              <option value="in_delivery">En cours de livraison</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livré</option>
              <option value="rescheduled">Reprogrammé</option>
              <option value="cancelled">Annulé</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-colors"
            >
              <option value="-createdAt">Plus récent</option>
              <option value="createdAt">Plus ancien</option>
              <option value="name">Nom (A-Z)</option>
              <option value="-name">Nom (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            </div>
            <p className="text-gray-600 font-medium">Chargement des commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-900 text-lg font-semibold mb-1">Aucune commande trouvée</p>
            <p className="text-gray-600 text-sm">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="lg:hidden space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className={`bg-white rounded-2xl border-2 transition-all ${
                    selectedOrders.has(order._id) ? 'border-purple-500 shadow-lg' : 'border-gray-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleOrderSelection(order._id);
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0 mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-900">#{order._id?.slice(-8).toUpperCase()}</p>
                            <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${getStatusColor(order.status || 'new')}`}>
                              {getStatusLabel(order.status || 'new')}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{order.name}</p>
                          <p className="text-xs text-gray-600">{order.phone}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{formatPrice(order.totalPrice || order.productPrice)}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        <p className="font-medium">{getFirstWord(order.productName)}</p>
                        <p className="text-gray-500">Qty: {order.quantity || 1} • {order.city}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isSomeSelected;
                        }}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Commande
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Prix total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                  </tr>
                </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredOrders.map((order) => (
                        <tr
                          key={order._id}
                          className={`hover:bg-gray-50 transition-colors group ${
                            selectedOrders.has(order._id) ? 'bg-purple-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order._id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleOrderSelection(order._id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="text-sm font-bold text-gray-900">
                              #{order._id?.slice(-8).toUpperCase()}
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="text-sm font-semibold text-gray-900">{order.name}</div>
                            <div className="text-sm text-gray-600">{order.phone}</div>
                            <div className="text-xs text-gray-500">{order.city}</div>
                          </td>
                          <td
                            className="px-6 py-4 cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="text-sm font-medium text-gray-900">{getFirstWord(order.productName)}</div>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="text-sm font-medium text-gray-900">{order.quantity || 1}</div>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="text-sm font-bold text-gray-900">
                              {formatPrice(order.totalPrice || order.productPrice)}
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="text-sm text-gray-600">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-full ${getStatusColor(order.status || 'new')}`}>
                              {getStatusLabel(order.status || 'new')}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Voir"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOrder(order);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteOrder(order._id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateOrderStatus}
          onEdit={() => {
            setEditingOrder(selectedOrder);
            setSelectedOrder(null);
          }}
          onDelete={deleteOrder}
        />
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={updateOrder}
        />
      )}
    </AdminLayout>
  );
}

function OrderDetailsModal({ order, onClose, onStatusChange, onEdit, onDelete }) {
  const [changingStatus, setChangingStatus] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-indigo-100 text-indigo-800';
      case 'called':
        return 'bg-cyan-100 text-cyan-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'in_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'rescheduled':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'Nouvelle commande';
      case 'called':
        return 'Appelé';
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En traitement';
      case 'in_delivery':
        return 'En cours de livraison';
      case 'shipped':
        return 'Expédiée';
      case 'delivered':
        return 'Livré';
      case 'rescheduled':
        return 'Reprogrammé';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Nouvelle commande';
    }
  };

  const handleStatusChange = async (newStatus) => {
    setChangingStatus(true);
    await onStatusChange(order._id, newStatus);
    setChangingStatus(false);
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Commande #{order._id?.slice(-8).toUpperCase()}
            </h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Résumé de la commande</h3>
                  <p className="text-sm text-gray-600">ID: #{order._id?.slice(-8).toUpperCase()}</p>
                </div>
                <span className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full ${getStatusColor(order.status || 'new')}`}>
                  {getStatusLabel(order.status || 'new')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/60 backdrop-blur rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-600 mb-1">Produit</p>
                  <p className="text-sm font-bold text-gray-900">{getFirstWord(order.productName)}</p>
                </div>
                <div className="bg-white/60 backdrop-blur rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-600 mb-1">Quantité</p>
                  <p className="text-2xl font-bold text-gray-900">{order.quantity || 1}</p>
                </div>
                <div className="bg-white/60 backdrop-blur rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-600 mb-1">Prix total</p>
                  <p className="text-xl font-bold text-purple-700">{order.totalPrice || order.productPrice || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Informations client
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nom complet</p>
                      <p className="text-base font-semibold text-gray-900">{order.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Téléphone</p>
                      <a
                        href={`tel:${order.phone}`}
                        className="text-base font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-2"
                      >
                        {order.phone}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ville</p>
                      <p className="text-base font-semibold text-gray-900">{order.city}</p>
                    </div>
                  </div>
                  {order.address && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Adresse complète</p>
                        <p className="text-base font-medium text-gray-900">{order.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Détails de la commande
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date de commande</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Quantité commandée</p>
                      <p className="text-2xl font-bold text-gray-900">{order.quantity || 1}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Montant total</p>
                      <p className="text-2xl font-bold text-purple-700">{order.totalPrice || order.productPrice || 'N/A'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Images */}
          {order.productImages && order.productImages.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Images du produit
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {order.productImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`${order.productName} ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 group-hover:border-purple-400 transition-colors shadow-sm"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x200?text=Image+non+disponible';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors flex items-center justify-center">
                      <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          {(order.productShortDesc || order.productFullDesc || order.productBenefits || order.productUsage || order.productGuarantee) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informations produit
              </h3>
              <div className="space-y-5">
                {order.productShortDesc && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Description courte</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{order.productShortDesc}</p>
                  </div>
                )}
                {order.productFullDesc && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Description complète</p>
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{order.productFullDesc}</p>
                  </div>
                )}
                {order.productBenefits && order.productBenefits.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Bénéfices</p>
                    <ul className="space-y-2">
                      {order.productBenefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-900">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {order.productUsage && (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Mode d'utilisation</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{order.productUsage}</p>
                  </div>
                )}
                {order.productGuarantee && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Garantie
                    </p>
                    <p className="text-sm text-gray-900 leading-relaxed">{order.productGuarantee}</p>
                  </div>
                )}
                {order.productDeliveryInfo && (
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Informations de livraison
                    </p>
                    <p className="text-sm text-gray-900 leading-relaxed">{order.productDeliveryInfo}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Reviews */}
          {order.productReviews && order.productReviews.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Avis clients ({order.productReviews.length})
              </h3>
              <div className="space-y-4">
                {order.productReviews.map((review, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                          {review.author?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.author || 'Anonyme'}</p>
                          <p className="text-xs text-gray-500">{review.date || 'Date inconnue'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 leading-relaxed mt-2">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-700">Changer le statut:</span>
            <select
              value={order.status || 'new'}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={changingStatus}
              className="px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 bg-white shadow-sm"
            >
              <option value="new">Nouvelle commande</option>
              <option value="called">Appelé</option>
              <option value="pending">En attente</option>
              <option value="processing">En traitement</option>
              <option value="in_delivery">En cours de livraison</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livré</option>
              <option value="rescheduled">Reprogrammé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onEdit();
              }}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors shadow-sm"
            >
              Modifier
            </button>
            <button
              onClick={() => {
                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
                  onDelete(order._id);
                  onClose();
                }
              }}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              Supprimer
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditOrderModal({ order, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: order.name || '',
    phone: order.phone || '',
    city: order.city || '',
    address: order.address || '',
    quantity: order.quantity || 1,
    totalPrice: order.totalPrice || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const success = await onSave(order._id, formData);
    setSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-slideUp max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">
            Modifier la commande #{order._id?.slice(-8).toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantité
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prix total
              </label>
              <input
                type="text"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="ex: 9,900 FCFA"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement...
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminOrdersPage;
