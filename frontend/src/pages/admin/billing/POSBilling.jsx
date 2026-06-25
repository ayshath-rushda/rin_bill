import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { billingApi } from '@/api/billing.api';
import POSSearch from '@/components/billing/POSSearch';
import InvoiceCart from '@/components/billing/InvoiceCart';
import PaymentDialog from '@/components/billing/PaymentDialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Printer } from 'lucide-react';

export default function POSBilling() {
  const navigate = useNavigate();
  const [invoiceType, setInvoiceType] = useState('retail');
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const createMutation = useMutation({
    mutationFn: (paymentData) =>
      billingApi.createInvoice({
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        discount,
        ...paymentData,
        type: invoiceType,
        customerId: customer?._id || undefined,
        customerSnapshot: customer
          ? { name: customer.name, phone: customer.phone, email: customer.email, gstin: customer.gstin }
          : undefined,
      }),
    onSuccess: (data) => {
      toast.success('Invoice created successfully');
      setCartItems([]);
      setDiscount(0);
      setCustomer(null);
      setPaymentOpen(false);
      navigate(`/admin/billing/invoices/${data._id}`);
    },
    onError: (err) => {
      const msg = err?.error?.message || err?.message || 'Failed to create invoice';
      toast.error(msg);
    },
  });

  const handleAddItem = useCallback((product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          code: product.code,
          price: product.sellingPrice,
          quantity: 1,
          maxStock: product.stock,
        },
      ];
    });
  }, []);

  const handleUpdateQuantity = useCallback((productId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const handleClear = useCallback(() => {
    setCartItems([]);
    setDiscount(0);
    setCustomer(null);
  }, []);

  const handlePaymentSubmit = (paymentData) => {
    createMutation.mutate(paymentData);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">POS Billing</h1>
          <p className="text-sm text-muted-foreground">Point of Sale — create invoices quickly</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border p-0.5">
            <button
              onClick={() => { setInvoiceType('retail'); setCustomer(null); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${invoiceType === 'retail' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Retail
            </button>
            <button
              onClick={() => setInvoiceType('wholesale')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${invoiceType === 'wholesale' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Wholesale
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-2/5 flex flex-col gap-4">
          <POSSearch onAddItem={handleAddItem} />

          {invoiceType === 'wholesale' && (
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Customer</p>
              {customer ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.gstin || 'No GSTIN'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>Change</Button>
                </div>
              ) : (
                <CustomerSearch onSelect={setCustomer} />
              )}
            </div>
          )}
        </div>

        <div className="w-3/5 border rounded-lg p-4 flex flex-col bg-card">
          <InvoiceCart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClear={handleClear}
            discount={discount}
            onDiscountChange={setDiscount}
            customer={customer}
            type={invoiceType}
          />

          {cartItems.length > 0 && (
            <Button
              size="lg"
              className="w-full mt-4"
              onClick={() => setPaymentOpen(true)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Proceed to Payment — ₹{total.toFixed(2)}
            </Button>
          )}
        </div>
      </div>

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={total}
        onSubmit={handlePaymentSubmit}
        loading={createMutation.isPending}
      />
    </div>
  );
}

function CustomerSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = null;

  const handleChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val || val.length < 1) {
      setResults([]);
      return;
    }
    if (debounceRef) clearTimeout(debounceRef);
    setTimeout(async () => {
      setLoading(true);
      try {
        const data = await billingApi.searchCustomers(val, 'wholesale');
        setResults(data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={handleChange}
        placeholder="Search wholesale customers..."
        className="w-full h-9 px-3 rounded-md border text-sm"
      />
      {results.length > 0 && (
        <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c._id}
              onClick={() => onSelect(c)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
            >
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.phone || c.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
