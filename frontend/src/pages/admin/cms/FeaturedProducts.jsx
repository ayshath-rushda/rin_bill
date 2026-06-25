import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cmsApi } from '@/api/cms.api';
import { productApi } from '@/api/product.api';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';

const sections = [
  { key: 'featured', label: 'Featured', color: 'bg-blue-100 text-blue-800' },
  { key: 'best_seller', label: 'Best Sellers', color: 'bg-green-100 text-green-800' },
  { key: 'new_arrival', label: 'New Arrivals', color: 'bg-purple-100 text-purple-800' },
];

function FeaturedProducts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [removeId, setRemoveId] = useState(null);

  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['featured-products', 'all'],
    queryFn: () => cmsApi.getAllFeaturedProducts(),
  });

  const { data: searchData } = useQuery({
    queryKey: ['products', 'search', searchQuery],
    queryFn: () => productApi.list({ search: searchQuery, limit: 10 }),
    enabled: searchQuery.length >= 2,
  });

  const featuredProducts = featuredData?.data || [];
  const searchResults = searchData?.data?.data || [];

  const assignMutation = useMutation({
    mutationFn: (data) => cmsApi.assignFeatured(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast.success('Product assigned');
      setSearchQuery('');
    },
    onError: (err) => toast.error(err?.error?.message || 'Failed to assign'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => cmsApi.removeFeatured(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast.success('Product removed');
      setRemoveId(null);
    },
    onError: (err) => toast.error(err?.error?.message || 'Failed to remove'),
  });

  const filtered = featuredProducts.filter((fp) => fp.section === activeTab);

  const assignedProductIds = featuredProducts
    .filter((fp) => fp.section === activeTab)
    .map((fp) => fp.product?._id)
    .filter(Boolean);

  const unassignedResults = searchResults.filter(
    (p) => !assignedProductIds.includes(p._id)
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Featured Products</h1>

      <div className="flex gap-1 border-b">
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveTab(section.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === section.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search products to add to "${sections.find((s) => s.key === activeTab)?.label}"...`}
          className="pl-9"
        />
        {searchQuery.length >= 2 && unassignedResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
                {unassignedResults.map((product) => (
              <div
                key={product._id}
                role="button"
                tabIndex={0}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  assignMutation.mutate({ productId: product._id, section: activeTab });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    assignMutation.mutate({ productId: product._id, section: activeTab });
                  }
                }}
              >
                {product.images?.[0] && (
                  <img src={product.images[0]} alt="" className="size-8 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.code} - ${product.sellingPrice}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-md border text-sm text-muted-foreground">
          No products assigned to this section. Search above to add products.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((fp) => (
            <div
              key={fp._id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              {fp.product?.images?.[0] && (
                <img src={fp.product.images[0]} alt="" className="size-12 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{fp.product?.name || 'Deleted Product'}</div>
                <div className="text-xs text-muted-foreground">
                  {fp.product?.code} - ${fp.product?.sellingPrice}
                </div>
              </div>
              <Badge variant="outline" className={sections.find((s) => s.key === fp.section)?.color}>
                {fp.section.replace('_', ' ')}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRemoveId(fp._id)}
              >
                <X className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!removeId}
        onOpenChange={() => setRemoveId(null)}
        title="Remove from section?"
        message="This product will no longer appear in this section on the homepage."
        destructive
        confirmLabel="Remove"
        onConfirm={() => removeId && removeMutation.mutate(removeId)}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}

export default FeaturedProducts;
