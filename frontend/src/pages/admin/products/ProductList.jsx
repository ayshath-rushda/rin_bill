import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productApi } from '@/api/product.api';
import { categoryApi } from '@/api/category.api';
import { brandApi } from '@/api/brand.api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import Pagination from '@/components/shared/Pagination';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
const statusStyle = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600',
  draft: 'bg-transparent text-muted-foreground border border-dashed',
};

function ProductList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.getAll(true),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.getAll(),
  });

  const queryParams = { page, limit: 10 };
  if (search) queryParams.search = search;
  if (categoryFilter) queryParams.category = categoryFilter;
  if (brandFilter) queryParams.brand = brandFilter;
  if (statusFilter) queryParams.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productApi.list(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deactivated');
      setDeleteId(null);
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete'),
  });

  const result = data?.data || {};
  const products = result.data || [];
  const meta = result.meta || { page: 1, totalPages: 1, total: 0 };

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];

  const columns = [
    {
      key: 'images',
      label: 'Image',
      render: (row) =>
        row.images?.length ? (
          <img src={row.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">—</div>
        ),
    },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code' },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name || '-',
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (row) => row.brand?.name || '-',
    },
    {
      key: 'sellingPrice',
      label: 'Price',
      sortable: true,
      render: (row) => `\u20B9${row.sellingPrice?.toLocaleString()}`,
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusStyle[row.status] || statusStyle.draft}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/products/${row._id}/edit`);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row._id);
            }}
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => navigate('/admin/products/new')}>Add Product</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-64">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products..." />
        </div>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={brandFilter}
          onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/admin/products/${row._id}/edit`)}
        emptyMessage="No products found"
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        onChange={setPage}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Deactivate Product?"
        message="This will set the product status to inactive. It can be reactivated later."
        destructive
        confirmLabel="Deactivate"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default ProductList;
