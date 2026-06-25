import { useState, useRef } from 'react';
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
import { GripVertical, Pencil, Trash2 } from 'lucide-react';

const defaultForm = {
  title: '',
  subtitle: '',
  description: '',
  buttonText: '',
  buttonUrl: '',
  bannerImage: '',
  displayOrder: 0,
  isActive: true,
  startDate: null,
  endDate: null,
};

function SliderList() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const dragNode = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sliders', 'all'],
    queryFn: () => cmsApi.getAllSliders(),
  });

  const sliders = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body) => cmsApi.createSlider(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
      toast.success('Slider created');
      closeDialog();
    },
    onError: (err) => toast.error(err?.error?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => cmsApi.updateSlider(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
      toast.success('Slider updated');
      closeDialog();
    },
    onError: (err) => toast.error(err?.error?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cmsApi.deleteSlider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
      toast.success('Slider deleted');
      setDeleteId(null);
    },
    onError: (err) => toast.error(err?.error?.message || 'Failed to delete'),
  });

  const reorderMutation = useMutation({
    mutationFn: (items) => cmsApi.reorderSliders(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
    },
    onError: () => toast.error('Failed to reorder'),
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
      subtitle: row.subtitle || '',
      description: row.description || '',
      buttonText: row.buttonText || '',
      buttonUrl: row.buttonUrl || '',
      bannerImage: row.bannerImage || '',
      displayOrder: row.displayOrder,
      isActive: row.isActive,
      startDate: row.startDate ? row.startDate.slice(0, 16) : null,
      endDate: row.endDate ? row.endDate.slice(0, 16) : null,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleUpload = async (formData) => {
    setUploading(true);
    try {
      const res = await cmsApi.uploadImage(formData);
      const url = res.data.url;
      setForm((prev) => ({ ...prev, bannerImage: url }));
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
    if (!editItem && !form.bannerImage) errs.bannerImage = 'Banner image is required';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = { ...form };
    payload.startDate = payload.startDate || null;
    payload.endDate = payload.endDate || null;

    if (editItem) {
      updateMutation.mutate({ id: editItem._id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  /* Drag-and-drop reorder */
  const handleDragStart = (e, index) => {
    dragNode.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragNode.current === index) return;
    const items = [...sliders];
    const dragged = items[dragNode.current];
    items.splice(dragNode.current, 1);
    items.splice(index, 0, dragged);
    dragNode.current = index;

    const reordered = items.map((item, i) => ({ id: item._id, displayOrder: i }));
    reorderMutation.mutate(reordered);
  };

  const handleDragEnd = () => {
    dragNode.current = null;
    setDragIndex(null);
  };

  const columns = [
    {
      key: '_drag',
      label: '',
      render: (_row, _i) => (
        <span
          draggable
          onDragStart={(e) => handleDragStart(e, sliders.indexOf(_row))}
          onDragOver={(e) => handleDragOver(e, sliders.indexOf(_row))}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing inline-block"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </span>
      ),
    },
    { key: 'displayOrder', label: 'Order' },
    {
      key: 'bannerImage',
      label: 'Image',
      render: (row) =>
        row.bannerImage ? (
          <img src={row.bannerImage} alt="" className="size-10 rounded object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">No image</span>
        ),
    },
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      label: 'Schedule',
      render: (row) => {
        if (!row.startDate && !row.endDate) return <span className="text-xs text-muted-foreground">Always</span>;
        const start = row.startDate ? new Date(row.startDate).toLocaleDateString() : '';
        const end = row.endDate ? new Date(row.endDate).toLocaleDateString() : '';
        return <span className="text-xs">{start}{start && end ? ' - ' : ''}{end}</span>;
      },
    },
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
        <h1 className="text-2xl font-bold">Sliders</h1>
        <Button onClick={openCreate}>Add Slider</Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Drag the grip handle to reorder sliders. Changes save automatically.
      </div>

      <DataTable
        columns={columns}
        data={sliders}
        isLoading={isLoading}
        emptyMessage="No sliders found"
      />

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Slider' : 'Add Slider'}</DialogTitle>
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
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buttonText">Button Text</Label>
                <Input
                  id="buttonText"
                  value={form.buttonText}
                  onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonUrl">Button URL</Label>
                <Input
                  id="buttonUrl"
                  value={form.buttonUrl}
                  onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Banner Image {!editItem && '*'}</Label>
              {form.bannerImage && (
                <img src={form.bannerImage} alt="" className="h-24 w-full rounded border object-cover" />
              )}
              <FileUpload
                onUpload={handleUpload}
                multiple={false}
                maxFiles={1}
              />
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
              {formErrors.bannerImage && <p className="text-xs text-destructive">{formErrors.bannerImage}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={form.startDate || ''}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={form.endDate || ''}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value || null })}
                />
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
        title="Delete Slider?"
        message="This slider will be permanently removed."
        destructive
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default SliderList;
