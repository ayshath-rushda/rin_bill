import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryApi } from '@/api/inventory.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const reasons = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'stolen', label: 'Stolen' },
  { value: 'returned', label: 'Returned' },
  { value: 'other', label: 'Other' },
];

function StockOutForm({ open, onOpenChange, product }) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('damaged');

  const mutation = useMutation({
    mutationFn: (data) => inventoryApi.stockOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      toast.success('Stock removed successfully');
      setQuantity('');
      setReason('damaged');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err?.message || 'Failed to remove stock'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quantity || parseInt(quantity, 10) < 1) return;
    if (parseInt(quantity, 10) > product.stock) {
      toast.error(`Insufficient stock. Available: ${product.stock}`);
      return;
    }
    mutation.mutate({ productId: product._id, quantity: parseInt(quantity, 10), reason });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock Out — {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current stock: <strong>{product.stock}</strong>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <select
              id="reason"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Removing...' : 'Remove Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default StockOutForm;
