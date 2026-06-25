import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { billingApi } from '@/api/billing.api';
import DataTable from '@/components/shared/DataTable';
import Pagination from '@/components/shared/Pagination';
import SearchInput from '@/components/shared/SearchInput';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Receipt } from 'lucide-react';

const typeBadgeVariants = {
  retail: 'default',
  wholesale: 'secondary',
};

const paymentBadgeVariants = {
  completed: 'success',
  partial: 'warning',
  pending: 'secondary',
  cancelled: 'destructive',
};

const columns = [
  { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
  { key: 'customerSnapshot.name', label: 'Customer', sortable: false, render: (row) => row.customerSnapshot?.name || 'Walk-in' },
  { key: 'type', label: 'Type', sortable: true, render: (row) => <StatusBadge variant={typeBadgeVariants[row.type]}>{row.type}</StatusBadge> },
  { key: 'total', label: 'Total', sortable: true, render: (row) => `₹${(row.total || 0).toFixed(2)}` },
  { key: 'amountPaid', label: 'Paid', sortable: false, render: (row) => `₹${(row.amountPaid || 0).toFixed(2)}` },
  { key: 'balance', label: 'Balance', sortable: false, render: (row) => `₹${(row.balance || 0).toFixed(2)}` },
  { key: 'paymentStatus', label: 'Status', sortable: true, render: (row) => <StatusBadge variant={paymentBadgeVariants[row.paymentStatus]}>{row.paymentStatus}</StatusBadge> },
  { key: 'createdAt', label: 'Date', sortable: true, render: (row) => new Date(row.createdAt).toLocaleDateString() },
];

export default function InvoiceList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page'), 10) || 1;
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (type) params.type = type;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const result = await billingApi.listInvoices(params);
      setInvoices(result.data || []);
      setMeta(result.meta || null);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, paymentStatus]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">View and manage all invoices</p>
        </div>
        <Button onClick={() => navigate('/admin/billing')}>
          <Plus className="size-4 mr-2" /> New Invoice
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={search}
          onChange={(val) => updateParam('search', val)}
          placeholder="Search by invoice # or customer..."
          className="w-72"
        />
        <select
          value={type}
          onChange={(e) => updateParam('type', e.target.value)}
          className="h-9 px-3 rounded-md border text-sm bg-background"
        >
          <option value="">All types</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => updateParam('paymentStatus', e.target.value)}
          className="h-9 px-3 rounded-md border text-sm bg-background"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Receipt className="size-12 mb-3" />
          <p className="text-lg font-medium">No invoices found</p>
          <p className="text-sm">Create your first invoice from POS Billing</p>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={invoices}
            onRowClick={(row) => navigate(`/admin/billing/invoices/${row._id}`)}
          />
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(p) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', p.toString());
                setSearchParams(params);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
