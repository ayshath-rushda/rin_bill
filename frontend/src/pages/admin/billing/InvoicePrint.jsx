import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingApi } from '@/api/billing.api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

export default function InvoicePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await billingApi.getInvoicePrint(id);
        setInvoice(result.data || result);
      } catch {
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (!loading && invoice) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, invoice]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
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
    <div>
      <div className="no-print flex items-center gap-2 mb-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-5" />
        </Button>
        <Button onClick={() => window.print()}>Print Again</Button>
      </div>

      <div className="max-w-2xl mx-auto p-8 print:p-0 print:mx-0">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">RINBILL STORE</h1>
          <p className="text-sm text-muted-foreground">123, Main Street, City</p>
          <p className="text-sm text-muted-foreground">Phone: +91-9876543210</p>
        </div>

        <div className="text-center border-t border-b py-2 mb-4">
          <p className="font-semibold uppercase tracking-wide">
            {invoice.type === 'wholesale' ? 'Tax Invoice (Wholesale)' : 'Tax Invoice (Retail)'}
          </p>
        </div>

        <div className="flex justify-between text-sm mb-6">
          <div>
            <p><span className="text-muted-foreground">Invoice No:</span> {invoice.invoiceNumber}</p>
            <p><span className="text-muted-foreground">Date:</span> {new Date(invoice.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p><span className="text-muted-foreground">Customer:</span> {invoice.customerSnapshot?.name || 'Walk-in Customer'}</p>
            {invoice.customerSnapshot?.gstin && <p><span className="text-muted-foreground">GSTIN:</span> {invoice.customerSnapshot.gstin}</p>}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-t border-b">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">Item</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Rate</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2">{idx + 1}</td>
                <td className="py-2">{item.productSnapshot?.name || '-'}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">{item.price.toFixed(2)}</td>
                <td className="text-right py-2">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{(invoice.subtotal || 0).toFixed(2)}</span></div>
            {invoice.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-₹{invoice.discount.toFixed(2)}</span></div>}
            {invoice.taxTotal > 0 && <div className="flex justify-between"><span>Tax</span><span>₹{invoice.taxTotal.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>Total</span>
              <span>₹{(invoice.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-sm mb-6 border-t pt-3">
          <p><span className="text-muted-foreground">Payment:</span> <span className="capitalize">{invoice.paymentMethod}</span></p>
          <p><span className="text-muted-foreground">Amount Paid:</span> ₹{(invoice.amountPaid || 0).toFixed(2)}</p>
          {invoice.balance > 0 && <p><span className="text-muted-foreground">Balance Due:</span> ₹{invoice.balance.toFixed(2)}</p>}
        </div>

        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p className="font-medium">Thank You!</p>
          <p>Visit us again at rinbill.com</p>
        </div>
      </div>
    </div>
  );
}
