import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/api/report.api';
import DataTable from '@/components/shared/DataTable';
import Pagination from '@/components/shared/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, Search } from 'lucide-react';

function CustomerReport() {
  const [customerId, setCustomerId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [purchasePage, setPurchasePage] = useState(1);

  const topQuery = useQuery({
    queryKey: ['top-customers'],
    queryFn: () => reportApi.getTopCustomers(10),
  });

  const purchaseQuery = useQuery({
    queryKey: ['customer-purchases', customerId, purchasePage],
    queryFn: () => reportApi.getCustomerPurchases(customerId, { page: purchasePage, limit: 10 }),
    enabled: !!customerId,
  });

  const topCustomers = topQuery.data || [];
  const purchaseData = purchaseQuery.data || {};
  const customerInfo = purchaseData.customer || null;
  const purchaseOrders = purchaseData.data || [];
  const purchaseMeta = purchaseData.meta || {};

  const topColumns = [
    { key: 'rank', label: '#', render: (_row, idx) => idx + 1 },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'totalOrders', label: 'Orders', sortable: true },
    {
      key: 'totalSpend',
      label: 'Total Spend',
      sortable: true,
      render: (row) => `₹${row.totalSpend?.toLocaleString()}`,
    },
  ];

  const purchaseColumns = [
    { key: 'orderNumber', label: 'Order #' },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (row) => <Badge variant="outline" className="capitalize">{row.orderStatus}</Badge>,
    },
    { key: 'total', label: 'Total', render: (row) => `₹${row.total?.toLocaleString()}` },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (row) => (
        <Badge variant={row.paymentStatus === 'completed' ? 'success' : 'secondary'}>
          {row.paymentStatus}
        </Badge>
      ),
    },
  ];

  const handleSearchCustomer = async () => {
    if (!searchInput.trim()) return;
    const res = await reportApi.getTopCustomers(100);
    const found = res.find(
      (c) => c.name?.toLowerCase().includes(searchInput.toLowerCase()) || c.email?.toLowerCase().includes(searchInput.toLowerCase())
    );
    if (found) {
      setCustomerId(found.customerId);
      setPurchasePage(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Customer Report</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {topQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <DataTable
              columns={topColumns}
              data={topCustomers}
              emptyMessage="No customer data available"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Purchase History</CardTitle>
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Search customer by name or email..."
              className="max-w-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
            />
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={handleSearchCustomer}
            >
              <Search className="h-4 w-4 mr-1" /> Search
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {!customerId ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Search for a customer to view purchase history
            </div>
          ) : purchaseQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
              {customerInfo && (
                <div className="mb-4 rounded-md bg-muted p-3">
                  <p className="font-medium">{customerInfo.name}</p>
                  <p className="text-sm text-muted-foreground">{customerInfo.email}</p>
                </div>
              )}
              <DataTable
                columns={purchaseColumns}
                data={purchaseOrders}
                emptyMessage="No orders found for this customer"
              />
              <Pagination
                page={purchaseMeta.page || 1}
                totalPages={purchaseMeta.totalPages || 1}
                total={purchaseMeta.total || 0}
                onChange={setPurchasePage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerReport;
