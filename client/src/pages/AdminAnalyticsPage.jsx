import AdminLayout from '../components/AdminLayout';

function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">Analytiques</h1>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Page analytiques en développement</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminAnalyticsPage;
