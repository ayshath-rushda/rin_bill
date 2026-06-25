import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingApi } from '@/api/billing.api';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, CreditCard } from 'lucide-react';
import PaymentDialog from '@/components/billing/PaymentDialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const paymentBadgeVariants = {
  completed: 'success',
  partial: 'warning',
  pending: 'secondary',
  cancelled: 'destructive',
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await billingApi.getInvoice(id);
        setInvoice(result.data || result);
      } catch {
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const paymentMutation = useMutation({
    mutationFn: (data) => billingApi.recordPayment({ invoiceId: id, amount: data.amountPaid, method: data.paymentMethod, transactionRef: data.transactionRef }),
    onSuccess: () => {
      toast.success('Payment recorded');
      setPaymentOpen(false);
      billingApi.getInvoice(id).then((result) => setInvoice(result.data || result));
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Payment failed');
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Invoice not found</p>
        <Button variant="link" onClick={() => navigate('/admin/billing/invoices')}>Back to invoices</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/billing/invoices')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
              <StatusBadge variant={paymentBadgeVariants[invoice.paymentStatus]}>{invoice.paymentStatus}</StatusBadge>
              <StatusBadge variant={invoice.type === 'wholesale' ? 'secondary' : 'default'}>{invoice.type}</StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">{new Date(invoice.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/billing/invoices/${id}/print`)}>
            <Printer className="size-4 mr-2" /> Print
          </Button>
          {invoice.paymentStatus !== 'completed' && invoice.paymentStatus !== 'cancelled' && (
            <Button onClick={() => setPaymentOpen(true)}>
              <CreditCard className="size-4 mr-2" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Customer Details</h3>
          <p className="text-sm">{invoice.customerSnapshot?.name || 'Walk-in Customer'}</p>
          {invoice.customerSnapshot?.phone && <p className="text-sm text-muted-foreground">{invoice.customerSnapshot.phone}</p>}
          {invoice.customerSnapshot?.email && <p className="text-sm text-muted-foreground">{invoice.customerSnapshot.email}</p>}
          {invoice.customerSnapshot?.gstin && <p className="text-sm text-muted-foreground">GSTIN: {invoice.customerSnapshot.gstin}</p>}
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Payment Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="capitalize">{invoice.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span>₹{(invoice.amountPaid || 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className={invoice.balance > 0 ? 'text-yellow-600 font-medium' : 'text-green-600'}>{invoice.balance > 0 ? `₹${invoice.balance.toFixed(2)}` : 'Paid'}</span></div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Item</th>
                <th className="text-left p-3">Code</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Rate</th>
                <th className="text-right p-3">GST</th>
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">{item.productSnapshot?.name || item.product?.name}</td>
                  <td className="p-3 text-muted-foreground">{item.productSnapshot?.code || ''}</td>
                  <td className="p-3 text-right">{item.quantity}</td>
                  <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
                  <td className="p-3 text-right">{item.gstRate ? `${item.gstRate}%` : '-'}</td>
                  <td className="p-3 text-right font-medium">₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border rounded-lg p-4 max-w-sm ml-auto">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{(invoice.subtotal || 0).toFixed(2)}</span></div>
          {invoice.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-green-600">-₹{invoice.discount.toFixed(2)}</span></div>}
          {invoice.taxTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹{invoice.taxTotal.toFixed(2)}</span></div>}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₹{(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {invoice.gstDetails && invoice.taxTotal > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">GST Details</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Taxable Value</span><span>₹{invoice.gstDetails.taxableValue?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>₹{(invoice.gstDetails.cgst || 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>₹{(invoice.gstDetails.sgst || 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><span>₹{(invoice.gstDetails.igst || 0).toFixed(2)}</span></div>
          </div>
        </div>
      )}

      {invoice.notes && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-1">Notes</h3>
          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
        </div>
      )}

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={invoice.balance || invoice.total}
        onSubmit={(data) => paymentMutation.mutate(data)}
        loading={paymentMutation.isPending}
      />
    </div>
  );
}
