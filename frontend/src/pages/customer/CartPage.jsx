import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Trash2, Heart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { fetchCart, updateCartItem, removeFromCart, toggleSaveForLater } from '@/features/cart/cartSlice';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';
import { extractError } from '@/api/address.api';

function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items, isLoading } = useSelector((state) => state.cart);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const activeItems = items.filter((i) => !i.savedForLater);
  const savedItems = items.filter((i) => i.savedForLater);
  const subtotal = activeItems.reduce((sum, i) => sum + (i.product?.sellingPrice || 0) * i.quantity, 0);

  const handleQtyChange = (productId, qty) => {
    if (qty < 1) return;
    dispatch(updateCartItem({ productId, quantity: qty })).unwrap().catch((err) => {
      toast.error(extractError(err));
    });
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId)).unwrap().then(() => {
      toast.success('Removed from cart');
    }).catch((err) => {
      toast.error(extractError(err));
    });
  };

  const handleToggleSave = (productId) => {
    dispatch(toggleSaveForLater(productId));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="size-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
        <Button asChild><Link to="/products">Browse Products</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {activeItems.length > 0 && (
            <>
              <h2 className="text-lg font-semibold">{activeItems.length} item{activeItems.length > 1 ? 's' : ''}</h2>
              {activeItems.map((item) => {
                const p = item.product;
                if (!p) return null;
                return (
                  <div key={item._id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="size-20 shrink-0 bg-muted rounded-md overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-muted-foreground">
                          <ShoppingCart className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${p.slug}`} className="font-medium hover:underline line-clamp-1">
                        {p.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">₹{p.sellingPrice?.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="icon" className="size-8"
                          onClick={() => handleQtyChange(p._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}>
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="size-8"
                          onClick={() => handleQtyChange(p._id, item.quantity + 1)}>
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">₹{(p.sellingPrice * item.quantity)?.toLocaleString()}</p>
                      <div className="flex gap-1 mt-2 justify-end">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleToggleSave(p._id)} title="Save for later">
                          <Heart className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleRemove(p._id)} title="Remove">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {savedItems.length > 0 && (
            <>
              <Separator className="my-6" />
              <h2 className="text-lg font-semibold">Saved for Later ({savedItems.length})</h2>
              {savedItems.map((item) => {
                const p = item.product;
                if (!p) return null;
                return (
                  <div key={item._id} className="flex gap-4 p-4 border rounded-lg opacity-70">
                    <div className="size-16 shrink-0 bg-muted rounded-md overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-muted-foreground">
                          <ShoppingCart className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{p.name}</p>
                      <p className="text-sm text-muted-foreground">₹{p.sellingPrice?.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleSave(p._id)}>
                        Move to Cart
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleRemove(p._id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 space-y-4 sticky top-24">
            <h2 className="font-semibold text-lg">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <Button className="w-full" size="lg" disabled={activeItems.length === 0} onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/products"><ArrowLeft className="size-4 mr-2" /> Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
