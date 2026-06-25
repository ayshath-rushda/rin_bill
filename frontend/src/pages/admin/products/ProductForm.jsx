import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productApi } from '@/api/product.api';
import { categoryApi } from '@/api/category.api';
import { brandApi } from '@/api/brand.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileUpload from '@/components/shared/FileUpload';

const defaultForm = {
  name: '',
  sku: '',
  category: '',
  brand: '',
  vehicleCompatibility: [],
  description: '',
  shortDescription: '',
  sellingPrice: '',
  costPrice: '',
  stock: 0,
  lowStockLimit: 5,
  weight: '',
  status: 'draft',
  hsnCode: '',
  gstRate: '',
};

function ProductForm() {
  const { id } = useParams();
  const [createdId, setCreatedId] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryApi.getAll(true),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.getAll(),
  });

  const productId = id || createdId;
  const isEdit = !!productId;

  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getById(productId),
    enabled: !!productId,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings', 'gstEnabled'],
    queryFn: async () => {
      const { default: api } = await import('@/api/axios');
      return api.get('/settings/gstEnabled');
    },
    placeholderData: { data: { value: false } },
  });

  const gstEnabled = settingsData?.data?.value === true;

  useEffect(() => {
    if (productData?.data) {
      const p = productData.data;
      setForm({
        name: p.name || '',
        sku: p.sku || '',
        category: p.category?._id || '',
        brand: p.brand?._id || '',
        vehicleCompatibility: p.vehicleCompatibility || [],
        description: p.description || '',
        shortDescription: p.shortDescription || '',
        sellingPrice: p.sellingPrice?.toString() || '',
        costPrice: p.costPrice?.toString() || '',
        stock: p.stock ?? 0,
        lowStockLimit: p.lowStockLimit ?? 5,
        weight: p.weight?.toString() || '',
        status: p.status || 'draft',
        hsnCode: p.hsnCode || '',
        gstRate: p.gstRate?.toString() || '',
      });
    }
  }, [productData]);

  const extractError = (err) => err?.error?.message || err?.message || 'Something went wrong';

  const createMutation = useMutation({
    mutationFn: (body) => productApi.create(body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
      setCreatedId(res.data._id);
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => productApi.update(productId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Product updated');
      navigate('/admin/products');
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ formData, type }) => productApi.uploadImages(productId, formData, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Images uploaded');
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.sellingPrice || parseFloat(form.sellingPrice) < 0) errs.sellingPrice = 'Valid selling price is required';
    if (!form.category) errs.category = 'Category is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      ...form,
      sellingPrice: parseFloat(form.sellingPrice),
      costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      stock: parseInt(form.stock, 10),
      lowStockLimit: parseInt(form.lowStockLimit, 10),
      gstRate: form.gstRate ? parseInt(form.gstRate, 10) : undefined,
    };

    if (!body.category) delete body.category;
    if (!body.brand) delete body.brand;

    if (isEdit) {
      updateMutation.mutate(body);
    } else {
      createMutation.mutate(body);
    }
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !form.vehicleCompatibility.includes(val)) {
      setForm({ ...form, vehicleCompatibility: [...form.vehicleCompatibility, val] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setForm({
      ...form,
      vehicleCompatibility: form.vehicleCompatibility.filter((t) => t !== tag),
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        <Button variant="outline" onClick={() => navigate('/admin/products')}>
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {formErrors.category && <p className="text-xs text-destructive">{formErrors.category}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <select
                  id="brand"
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Compatibility</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Type and press Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.vehicleCompatibility.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input id="shortDescription" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price *</Label>
              <Input id="sellingPrice" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
              {formErrors.sellingPrice && <p className="text-xs text-destructive">{formErrors.sellingPrice}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStockLimit">Low Stock Limit</Label>
              <Input id="lowStockLimit" type="number" min="0" value={form.lowStockLimit} onChange={(e) => setForm({ ...form, lowStockLimit: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {gstEnabled && (
          <Card>
            <CardHeader><CardTitle>GST Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input id="hsnCode" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstRate">GST Rate (%)</Label>
                <select
                  id="gstRate"
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  value={form.gstRate}
                  onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                >
                  <option value="">Select rate</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {productId && (
          <Card>
            <CardHeader><CardTitle>Images</CardTitle></CardHeader>
            <CardContent>
              <FileUpload
                onUpload={(formData) => uploadMutation.mutate({ formData, type: 'main' })}
                multiple
              />
              {productData?.data?.images?.length > 0 && (
                <div className="mt-4">
                  <Label>Current Images</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {productData.data.images.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="h-20 w-20 rounded-md border object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
