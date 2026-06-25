import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function PaymentDialog({ open, onClose, total, onSubmit, loading }) {
  const [amountPaid, setAmountPaid] = useState(total);
  const [method, setMethod] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');

  const balance = Math.max(0, total - amountPaid);
  const change = Math.max(0, amountPaid - total);

  const handleSubmit = () => {
    onSubmit({
      amountPaid: Number(amountPaid) || 0,
      paymentMethod: method,
      transactionRef: method !== 'cash' ? transactionRef : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Payment</DialogTitle>
          <DialogDescription>Enter payment details to complete the sale</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold">₹{total.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount Paid</Label>
            <Input
              id="amountPaid"
              type="number"
              min={0}
              step={0.01}
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
              className="text-lg font-semibold"
            />
          </div>

          {balance > 0 && (
            <div className="text-yellow-600 bg-yellow-50 rounded-lg p-3 text-sm font-medium">
              Balance Due: ₹{balance.toFixed(2)}
            </div>
          )}

          {change > 0 && (
            <div className="text-green-600 bg-green-50 rounded-lg p-3 text-sm font-medium">
              Change: ₹{change.toFixed(2)}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex gap-2">
              {paymentMethods.map((pm) => (
                <Button
                  key={pm.value}
                  variant={method === pm.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMethod(pm.value)}
                  className="flex-1"
                >
                  {pm.label}
                </Button>
              ))}
            </div>
          </div>

          {method !== 'cash' && (
            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Ref (optional)</Label>
              <Input
                id="transactionRef"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="UPI ref / Bank transaction ID"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || amountPaid <= 0}>
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            Complete Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
