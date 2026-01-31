import { useEffect, useState } from 'react';
import { getAdminRevenueOverview, type PlanDist } from '../../lib/api';
import { Loader2, DollarSign } from 'lucide-react';

export default function AdminRevenue() {
  const [mrr, setMrr] = useState(0);
  const [distribution, setDistribution] = useState<PlanDist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const res = await getAdminRevenueOverview();
      if (res.success && res.data) {
        setMrr(res.data.mrr);
        setDistribution(res.data.plan_distribution);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  const totalUsers = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <p className="text-gray-500 mt-1">Monthly recurring revenue and plan distribution</p>
      </div>

      {/* MRR Card */}
      <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <DollarSign className="h-8 w-8" />
          </div>
          <div>
            <p className="text-green-100 text-sm">Monthly Recurring Revenue</p>
            <p className="text-4xl font-bold">${mrr.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
        <div className="space-y-4">
          {distribution.map((d) => {
            const pct = totalUsers > 0 ? Math.round((d.count / totalUsers) * 100) : 0;
            const revenue = d.count * d.price_monthly;
            return (
              <div key={d.plan} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 capitalize">{d.plan}</span>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-900">{d.count}</span> users
                    {' '}({pct}%)
                    {' - '}
                    <span className="font-medium text-green-600">${revenue.toFixed(2)}/mo</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      d.plan === 'enterprise' ? 'bg-purple-500' :
                      d.plan === 'pro' ? 'bg-blue-500' :
                      d.plan === 'starter' ? 'bg-green-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue per plan table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Plan</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">Price</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">Users</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {distribution.map((d) => (
              <tr key={d.plan}>
                <td className="py-2 text-sm font-medium text-gray-900 capitalize">{d.plan}</td>
                <td className="py-2 text-sm text-gray-600 text-right">${d.price_monthly}/mo</td>
                <td className="py-2 text-sm text-gray-600 text-right">{d.count}</td>
                <td className="py-2 text-sm font-medium text-green-600 text-right">${(d.count * d.price_monthly).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="font-medium">
              <td className="py-2 text-sm text-gray-900">Total</td>
              <td className="py-2"></td>
              <td className="py-2 text-sm text-gray-900 text-right">{totalUsers}</td>
              <td className="py-2 text-sm text-green-700 text-right">${mrr.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
