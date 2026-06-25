import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/api/order.api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import Pagination from '@/components/shared/Pagination';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search } from 'lucide-react';

const statusOptions = ['', 'new', 'confirmed', 'packing', 'dispatched', 'delivered', 'cancelled', 'returned'];
const paymentOptions = ['', 'pending', 'completed', 'failed'];

function OrderList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const params = { page, limit: 20 };
  if (status) params.status = status;
  if (paymentStatus) params.paymentStatus = paymentStatus;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (search) params.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ['orders-admin', params],
    queryFn: () => orderApi.getAllAdmin(params),
  });

  const result = data || {};
  const orders = result.data || [];
  const meta = result.meta || { page: 1, totalPages: 1, total: 0 };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (row) => (
        <Link to={`/admin/orders/${row._id}`} className="font-medium text-primary hover:underline">
          {row.orderNumber}
        </Link>
      ),
    },
    {
      key: 'user',
      label: 'Customer',
      render: (row) => row.user?.name || 'N/A',
    },
    { key: 'total', label: 'Total', render: (row) => `₹${row.total?.toLocaleString()}` },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (row) => <StatusBadge status={row.orderStatus} />,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (row) => (
        <span className={`text-sm capitalize ${row.paymentStatus === 'completed' ? 'text-green-600' : row.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
          {row.paymentStatus}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button asChild variant="ghost" size="sm">
          <Link to={`/admin/orders/${row._id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="size-6" /> Orders
        </h1>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border rounded-md px-3 py-1.5 text-sm bg-background">
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Payment</label>
          <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="border rounded-md px-3 py-1.5 text-sm bg-background">
            {paymentOptions.map((p) => (
              <option key={p} value={p}>{p || 'All Payments'}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9" />
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">Search</label>
          <SearchInput
            placeholder="Search order #..."
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
          />
        </div>
      </div>

      <DataTable columns={columns} data={orders} isLoading={isLoading} />

      {meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      )}
    </div>
  );
}

export default OrderList;
