import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { api } from '../utils/api';

function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/orders', {
        headers: {
          'x-admin-key': 'ZENDO_ADMIN_2026',
        },
      });

      if (response.data.success) {
        const orders = response.data.orders || [];
        // Extract unique customers
        const customerMap = new Map();
        orders.forEach((order) => {
          const key = order.phone;
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              name: order.name,
              phone: order.phone,
              city: order.city,
              ordersCount: 0,
              totalSpent: 0,
              lastOrder: order.createdAt,
            });
          }
          const customer = customerMap.get(key);
          customer.ordersCount += 1;
          const price = order.totalPrice || order.productPrice || '0';
          const numPrice = parseFloat(price.replace(/[^\d.]/g, '')) || 0;
          customer.totalSpent += numPrice;
          if (new Date(order.createdAt) > new Date(customer.lastOrder)) {
            customer.lastOrder = order.createdAt;
          }
        });
        setCustomers(Array.from(customerMap.values()));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
            <p className="mt-1 text-sm text-gray-500">
              {customers.length} {customers.length > 1 ? 'clients' : 'client'}
            </p>
          </div>
        </div>
        <div className="px-6 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                        Téléphone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                        Ville
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                        Commandes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                        Total dépensé
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                        Dernière commande
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                          Aucun client
                        </td>
                      </tr>
                    ) : (
                      customers.map((customer, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <a
                              href={`tel:${customer.phone}`}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              {customer.phone}
                            </a>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{customer.city}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{customer.ordersCount}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.totalSpent.toLocaleString('fr-FR')} FCFA
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(customer.lastOrder)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCustomersPage;
