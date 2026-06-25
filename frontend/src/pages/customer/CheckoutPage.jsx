import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, MapPin, CreditCard, Check, ChevronRight, Loader2 } from 'lucide-react';
import { fetchCart, clearCart } from '@/features/cart/cartSlice';
import { addressApi, extractError } from '@/api/address.api';
import { orderApi } from '@/api/order.api';
import AddressForm from '@/components/address/AddressForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

const steps = ['Shipping', 'Review', 'Payment'];

function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const activeItems = items.filter((i) => !i.savedForLater);

  const { data: addresses, isLoading: addrLoading, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressApi.getAll(),
  });

  useEffect(() => {
    if (addresses?.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault);
      setSelectedAddressId(def?._id || addresses[0]._id);
    }
  }, [addresses, selectedAddressId]);

  const placeOrderMutation = useMutation({
    mutationFn: () => orderApi.create({ addressId: selectedAddressId, paymentMethod }),
    onSuccess: (data) => {
      dispatch(clearCart());
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${data._id}`);
    },
    onError: (err) => {
      toast.error(extractError(err));
    },
  });

  const subtotal = activeItems.reduce((sum, i) => sum + (i.product?.sellingPrice || 0) * i.quantity, 0);
  const selectedAddress = addresses?.find((a) => a._id === selectedAddressId);
  const addressList = Array.isArray(addresses) ? addresses : [];

  const handleAddressSubmit = async (formData) => {
    try {
      await addressApi.create(formData);
      toast.success('Address added');
      setShowAddressForm(false);
      refetchAddresses();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  if (activeItems.length === 0 && !placeOrderMutation.isPending) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="size-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Nothing to checkout</h1>
        <p className="text-muted-foreground mb-6">Your cart is empty or all items are saved for later.</p>
        <Button asChild><Link to="/cart">Go to Cart</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="flex items-center gap-2 mb-8 text-sm">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="size-3" /> : i + 1}
            </div>
            <span className={i <= step ? 'font-medium' : 'text-muted-foreground'}>{s}</span>
            {i < steps.length - 1 && <ChevronRight className="size-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="size-5" /> Shipping Address
          </h2>

          {showAddressForm ? (
            <div className="border rounded-lg p-4">
              <AddressForm onSubmit={handleAddressSubmit} onCancel={() => setShowAddressForm(false)} />
            </div>
          ) : (
            <>
              {addrLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-2">
                  {addressList.map((addr) => (
                    <div
                      key={addr._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedAddressId === addr._id ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground'}`}
                      onClick={() => setSelectedAddressId(addr._id)}
                    >
                      <div className="flex items-start gap-3">
                        <input type="radio" checked={selectedAddressId === addr._id} readOnly className="mt-1" />
                        <div>
                          <p className="font-medium">{addr.label}
                            {addr.isDefault && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">Default</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                          <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-sm text-muted-foreground">Phone: {addr.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)}>
                    + Add New Address
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => setStep(1)} disabled={!selectedAddressId}>Continue to Review</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Review Items</h2>

          {selectedAddress && (
            <div className="border rounded-lg p-3 text-sm bg-muted/30">
              <p className="font-medium">{selectedAddress.label}</p>
              <p className="text-muted-foreground">{selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
            </div>
          )}

          <div className="space-y-2">
            {activeItems.map((item) => {
              const p = item.product;
              if (!p) return null;
              return (
                <div key={item._id} className="flex items-center gap-3 border rounded-lg p-3">
                  <div className="size-12 shrink-0 bg-muted rounded overflow-hidden">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="size-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">₹{(p.sellingPrice * item.quantity)?.toLocaleString()}</p>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span>₹{subtotal.toLocaleString()}</span></div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)}>Continue to Payment</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="size-5" /> Payment Method
          </h2>

          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
            {[
              { value: 'cash', label: 'Cash', desc: 'Pay on delivery' },
              { value: 'upi', label: 'UPI', desc: 'Pay via UPI' },
              { value: 'bank_transfer', label: 'Bank Transfer', desc: 'Pay via bank transfer' },
            ].map((m) => (
              <div key={m.value} className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === m.value ? 'border-primary ring-1 ring-primary' : ''}`}
                onClick={() => setPaymentMethod(m.value)}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={m.value} id={m.value} />
                  <Label htmlFor={m.value} className="cursor-pointer">
                    <p className="font-medium">{m.label}</p>
                    <p className="text-sm text-muted-foreground">{m.desc}</p>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>₹{subtotal.toLocaleString()}</span></div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => placeOrderMutation.mutate()} disabled={placeOrderMutation.isPending}>
              {placeOrderMutation.isPending ? (
                <><Loader2 className="size-4 mr-2 animate-spin" /> Placing Order...</>
              ) : (
                <>Place Order - ₹{subtotal.toLocaleString()}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
