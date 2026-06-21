import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import Pagination from '@/components/shared/Pagination';
import StockInForm from '@/components/inventory/StockInForm';
import StockOutForm from '@/components/inventory/StockOutForm';
import StockAdjustForm from '@/components/inventory/StockAdjustForm';
import LowStockAlerts from '@/components/inventory/LowStockAlerts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackagePlus, PackageMinus, EqualApproximately } from 'lucide-react';

function InventoryPage() {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role?.name === 'super_admin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const queryParams = { page, limit: 20 };
  if (search) queryParams.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', queryParams],
    queryFn: () => inventoryApi.getAll(queryParams),
  });

  const result = data?.data || {};
  const products = result.data || [];
  const meta = result.meta || { page: 1, totalPages: 1, total: 0 };

  const stockBadge = (row) => {
    if (row.stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (row.stock <= row.lowStockLimit) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-300">In Stock</Badge>;
  };

  const columns = [
    { key: 'name', label: 'Product', sortable: true },
    { key: 'code', label: 'Code' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'stock',
      label: 'Current Stock',
      sortable: true,
      render: (row) => (
        <span className={row.stock <= row.lowStockLimit ? 'font-bold text-red-600' : ''}>
          {row.stock}
        </span>
      ),
    },
    { key: 'lowStockLimit', label: 'Low Limit' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => stockBadge(row),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Stock In"
            onClick={(e) => { e.stopPropagation(); setSelectedProduct(row); setStockInOpen(true); }}
          >
            <PackagePlus className="size-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Stock Out"
            onClick={(e) => { e.stopPropagation(); setSelectedProduct(row); setStockOutOpen(true); }}
          >
            <PackageMinus className="size-4 text-red-600" />
          </Button>
          {isSuperAdmin && (
            <Button
              variant="ghost"
              size="icon"
              title="Adjust"
              onClick={(e) => { e.stopPropagation(); setSelectedProduct(row); setAdjustOpen(true); }}
            >
              <EqualApproximately className="size-4 text-blue-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <LowStockAlerts />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-64">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products..." />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyMessage="No products found"
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        onChange={setPage}
      />

      {selectedProduct && (
        <>
          <StockInForm
            open={stockInOpen}
            onOpenChange={(v) => { setStockInOpen(v); if (!v) setSelectedProduct(null); }}
            product={selectedProduct}
          />
          <StockOutForm
            open={stockOutOpen}
            onOpenChange={(v) => { setStockOutOpen(v); if (!v) setSelectedProduct(null); }}
            product={selectedProduct}
          />
          {isSuperAdmin && (
            <StockAdjustForm
              open={adjustOpen}
              onOpenChange={(v) => { setAdjustOpen(v); if (!v) setSelectedProduct(null); }}
              product={selectedProduct}
            />
          )}
        </>
      )}
    </div>
  );
}

export default InventoryPage;
