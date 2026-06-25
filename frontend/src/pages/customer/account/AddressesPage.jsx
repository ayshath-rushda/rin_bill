import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { addressApi, extractError } from '@/api/address.api';
import AddressForm from '@/components/address/AddressForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';

function AddressesPage() {
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => addressApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted');
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id) => addressApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated');
    },
    onError: (err) => toast.error(err?.message || 'Failed to set default'),
  });

  const handleSubmit = async (formData) => {
    try {
      if (editingAddress) {
        await addressApi.update(editingAddress._id, formData);
        toast.success('Address updated');
      } else {
        await addressApi.create(formData);
        toast.success('Address added');
      }
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setDialogOpen(false);
      setEditingAddress(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to save address');
    }
  };

  const addrList = Array.isArray(addresses) ? addresses : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="size-6" /> My Addresses
        </h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingAddress(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" /> Add Address</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            </DialogHeader>
            <AddressForm
              initialData={editingAddress}
              onSubmit={handleSubmit}
              onCancel={() => { setDialogOpen(false); setEditingAddress(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : addrList.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addrList.map((addr) => (
            <div key={addr._id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {addr.label}
                    {addr.isDefault && <Star className="size-3 inline ml-2 text-yellow-500 fill-yellow-500" />}
                  </p>
                  <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-sm text-muted-foreground">Phone: {addr.phone}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!addr.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => setDefaultMutation.mutate(addr._id)} title="Set as default">
                      <Star className="size-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setEditingAddress(addr); setDialogOpen(true); }} title="Edit">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(addr._id)} title="Delete">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressesPage;
