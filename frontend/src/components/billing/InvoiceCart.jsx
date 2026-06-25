import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function InvoiceCart({
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  discount = 0,
  onDiscountChange,
  customer,
  type = 'retail',
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Invoice Cart</h3>
          <p className="text-sm text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive">
            <Trash2 className="size-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {customer && type === 'wholesale' && (
        <div className="bg-muted rounded-lg p-3 mb-4 text-sm">
          <p className="font-medium">{customer.name}</p>
          <p className="text-muted-foreground">{customer.gstin || 'No GSTIN'}</p>
          {customer.creditLimit > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Credit: ₹{customer.creditUsed || 0} / ₹{customer.creditLimit}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <p className="text-lg">Empty Cart</p>
            <p className="text-sm">Search and add products to begin</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item.productId || idx} className="border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.code}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={() => onRemoveItem(item.productId)}
                >
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= (item.maxStock || 999)}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">₹</span>
              <Input
                type="number"
                min={0}
                max={subtotal}
                value={discount}
                onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
                className="h-7 w-20 text-right text-sm"
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
