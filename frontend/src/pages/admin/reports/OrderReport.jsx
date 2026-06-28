import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/api/report.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = {
  new: '#3b82f6',
  confirmed: '#22c55e',
  packing: '#eab308',
  dispatched: '#a855f7',
  delivered: '#16a34a',
  cancelled: '#ef4444',
  returned: '#f97316',
};

function OrderReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = {};
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const { data, isLoading } = useQuery({
    queryKey: ['orders-report', params],
    queryFn: () => reportApi.getOrders(params),
  });

  const records = data?.records || [];
  const summary = data?.summary || { totalOrders: 0, totalRevenue: 0 };

  const pieData = records.map((r) => ({
    name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    value: r.count,
    status: r.status,
  }));

  const barData = records.map((r) => ({
    name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    Revenue: r.totalRevenue,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" /> Order Report
        </h1>
        <div className="flex items-center gap-2">
          <Input type="date" className="w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-muted-foreground">to</span>
          <Input type="date" className="w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary.totalOrders}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">₹{summary.totalRevenue?.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : barData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Count</th>
                    <th className="pb-2 font-medium">Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.status} className="border-b last:border-0">
                      <td className="py-2 capitalize">{r.status}</td>
                      <td className="py-2">{r.count}</td>
                      <td className="py-2">₹{r.totalRevenue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OrderReport;
