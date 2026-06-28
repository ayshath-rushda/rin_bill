import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/api/report.api';
import DataTable from '@/components/shared/DataTable';
import Pagination from '@/components/shared/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PackageSearch, Download, ArrowUpDown } from 'lucide-react';

function InventoryReport() {
  const [tab, setTab] = useState('stock');
  const [stockPage, setStockPage] = useState(1);
  const [movPage, setMovPage] = useState(1);
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const stockQuery = useQuery({
    queryKey: ['inventory-stock', { page: stockPage }],
    queryFn: () => reportApi.getInventoryStock({ page: stockPage, limit: 20 }),
  });

  const movParams = { page: movPage, limit: 20 };
  if (productFilter) movParams.product = productFilter;
  if (typeFilter) movParams.type = typeFilter;
  if (dateFrom) movParams.dateFrom = dateFrom;
  if (dateTo) movParams.dateTo = dateTo;

  const movQuery = useQuery({
    queryKey: ['inventory-movement', movParams],
    queryFn: () => reportApi.getInventoryMovement(movParams),
  });

  const stockResult = stockQuery.data || {};
  const stockData = stockResult.data || [];
  const stockMeta = stockResult.meta || {};

  const movResult = movQuery.data || {};
  const movData = movResult.data || [];
  const movMeta = movResult.meta || {};

  const stockColumns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name || '-',
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (row) => (
        <span className={row.stock <= row.lowStockLimit ? 'text-destructive font-medium' : ''}>
          {row.stock}
        </span>
      ),
    },
    { key: 'lowStockLimit', label: 'Low Limit', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  const movColumns = [
    {
      key: 'product',
      label: 'Product',
      render: (row) => row.product?.name || 'Deleted',
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const colors = { stock_in: 'success', stock_out: 'destructive', adjustment: 'warning' };
        return <Badge variant={colors[row.type] || 'default'}>{row.type.replace('_', ' ')}</Badge>;
      },
    },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'previousStock',
      label: 'Previous → New',
      render: (row) => `${row.previousStock} → ${row.newStock}`,
    },
    { key: 'reason', label: 'Reason' },
    { key: 'user', label: 'User', render: (row) => row.user?.name || '-' },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const handleExportInventory = () => {
    reportApi.exportInventory().then((res) => {
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory-report.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PackageSearch className="h-6 w-6" /> Inventory Report
        </h1>
        {tab === 'stock' && (
          <Button variant="outline" size="sm" onClick={handleExportInventory}>
            <Download className="h-4 w-4 mr-1" /> Export Excel
          </Button>
        )}
      </div>

      <div className="flex rounded-md border w-fit">
        <button
          className={`px-4 py-1.5 text-sm font-medium ${tab === 'stock' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          onClick={() => setTab('stock')}
        >
          Stock
        </button>
        <button
          className={`px-4 py-1.5 text-sm font-medium ${tab === 'movement' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          onClick={() => setTab('movement')}
        >
          Movement
        </button>
      </div>

      {tab === 'stock' ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={stockColumns}
              data={stockData}
              isLoading={stockQuery.isLoading}
              emptyMessage="No products found"
            />
            <Pagination
              page={stockMeta.page || 1}
              totalPages={stockMeta.totalPages || 1}
              total={stockMeta.total || 0}
              onChange={setStockPage}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement History</CardTitle>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Input
                placeholder="Product ID"
                className="w-40"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              />
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
              </select>
              <Input type="date" className="w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="date" className="w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={movColumns}
              data={movData}
              isLoading={movQuery.isLoading}
              emptyMessage="No movement records found"
            />
            <Pagination
              page={movMeta.page || 1}
              totalPages={movMeta.totalPages || 1}
              total={movMeta.total || 0}
              onChange={setMovPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InventoryReport;
