import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { brandApi } from '@/api/brand.api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const defaultForm = { name: '', logo: '', description: '' };

function BrandList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (body) => brandApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created');
      setDialogOpen(false);
      setForm(defaultForm);
    },
    onError: (err) => toast.error(err?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => brandApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand updated');
      setDialogOpen(false);
      setEditItem(null);
      setForm(defaultForm);
    },
    onError: (err) => toast.error(err?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => brandApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted');
      setDeleteId(null);
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete'),
  });

  const brands = data?.data || [];

  const filtered = search
    ? brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands;

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description' },
    {
      key: '_id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditItem(row);
              setForm({ name: row.name, logo: row.logo || '', description: row.description || '' });
              setDialogOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row._id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (editItem) {
      updateMutation.mutate({ id: editItem._id, body: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brands</h1>
        <Button onClick={openCreate}>Add Brand</Button>
      </div>

      <div className="max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search brands..." />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No brands found"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Brand?"
        message="This cannot be undone. If products are attached to this brand, deletion will be blocked."
        destructive
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default BrandList;
