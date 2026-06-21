import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import Pagination from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/badge';

const typeVariant = {
  stock_in: { label: 'Stock In', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  stock_out: { label: 'Stock Out', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  adjustment: { label: 'Adjustment', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
};

function InventoryHistory() {
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = { page, limit: 20 };
  if (typeFilter) queryParams.type = typeFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-history', queryParams],
    queryFn: () => inventoryApi.getHistory(queryParams),
  });

  const result = data?.data || {};
  const transactions = result.data || [];
  const meta = result.meta || { page: 1, totalPages: 1, total: 0 };

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (row) => row.product?.name || 'Deleted Product',
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const t = typeVariant[row.type] || { label: row.type, className: '' };
        return <Badge className={t.className}>{t.label}</Badge>;
      },
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => {
        const prefix = row.type === 'stock_in' ? '+' : row.type === 'stock_out' ? '-' : '→';
        const color = row.type === 'stock_in' ? 'text-green-600' : row.type === 'stock_out' ? 'text-red-600' : 'text-blue-600';
        return <span className={`font-mono font-bold ${color}`}>{prefix} {row.quantity}</span>;
      },
    },
    {
      key: 'previousStock',
      label: 'Previous',
      render: (row) => <span className="font-mono">{row.previousStock}</span>,
    },
    {
      key: 'newStock',
      label: 'New',
      render: (row) => <span className="font-mono">{row.newStock}</span>,
    },
    { key: 'reason', label: 'Reason' },
    {
      key: 'user',
      label: 'By',
      render: (row) => row.user?.name || '-',
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory History</h1>

      <div className="flex flex-wrap gap-3">
        <div className="w-64">
          <SearchInput value={productFilter} onChange={(v) => { setProductFilter(v); setPage(1); }} placeholder="Filter by product..." />
        </div>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          <option value="stock_in">Stock In</option>
          <option value="stock_out">Stock Out</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        emptyMessage="No transactions found"
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        onChange={setPage}
      />
    </div>
  );
}

export default InventoryHistory;
