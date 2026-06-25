import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cmsApi } from '@/api/cms.api';
import DataTable from '@/components/shared/DataTable';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import FileUpload from '@/components/shared/FileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Pencil, Trash2 } from 'lucide-react';

const positions = [
  { value: 'top', label: 'Top' },
  { value: 'middle', label: 'Middle' },
  { value: 'bottom', label: 'Bottom' },
];

const defaultForm = {
  title: '',
  image: '',
  url: '',
  position: 'top',
  isActive: true,
};

function BannerList() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['banners', 'all'],
    queryFn: () => cmsApi.getAllBanners(),
  });

  const banners = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body) => cmsApi.createBanner(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner created');
      closeDialog();
    },
    onError: (err) => toast.error(err?.error?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => cmsApi.updateBanner(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner updated');
      closeDialog();
    },
    onError: (err) => toast.error(err?.error?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cmsApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner deleted');
      setDeleteId(null);
    },
    onError: (err) => toast.error(err?.error?.message || 'Failed to delete'),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    setForm(defaultForm);
    setFormErrors({});
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditItem(row);
    setForm({
      title: row.title,
      image: row.image || '',
      url: row.url || '',
      position: row.position,
      isActive: row.isActive,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleUpload = async (formData) => {
    setUploading(true);
    try {
      const res = await cmsApi.uploadImage(formData);
      const url = res.data.url;
      setForm((prev) => ({ ...prev, image: url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!editItem && !form.image) errs.image = 'Image is required';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (editItem) {
      updateMutation.mutate({ id: editItem._id, body: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const positionBadge = (position) => {
    const colors = { top: 'bg-blue-100 text-blue-800', middle: 'bg-purple-100 text-purple-800', bottom: 'bg-orange-100 text-orange-800' };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[position] || ''}`}>
        {position}
      </span>
    );
  };

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (row) =>
        row.image ? (
          <img src={row.image} alt="" className="size-10 rounded object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">No image</span>
        ),
    },
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'position',
      label: 'Position',
      render: (row) => positionBadge(row.position),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { key: 'url', label: 'URL' },
    {
      key: '_id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); setDeleteId(row._id); }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Button onClick={openCreate}>Add Banner</Button>
      </div>

      <DataTable
        columns={columns}
        data={banners}
        isLoading={isLoading}
        emptyMessage="No banners found"
      />

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label>Image {!editItem && '*'}</Label>
              {form.image && (
                <img src={form.image} alt="" className="h-24 w-full rounded border object-cover" />
              )}
              <FileUpload
                onUpload={handleUpload}
                multiple={false}
                maxFiles={1}
              />
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
              {formErrors.image && <p className="text-xs text-destructive">{formErrors.image}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <div className="flex gap-4">
                {positions.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="position"
                      value={p.value}
                      checked={form.position === p.value}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="h-4 w-4"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
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
        title="Delete Banner?"
        message="This banner will be permanently removed."
        destructive
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default BannerList;
