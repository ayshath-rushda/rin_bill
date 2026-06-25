import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Grid3X3, List, SlidersHorizontal, X } from 'lucide-react';
import { customerApi } from '@/api/customer.api';
import { categoryApi } from '@/api/category.api';
import { brandApi } from '@/api/brand.api';
import { addToCart } from '@/features/cart/cartSlice';
import ProductCard from '@/components/customer/ProductCard';
import SearchInput from '@/components/shared/SearchInput';
import Pagination from '@/components/shared/Pagination';
import PriceRangeSlider from '@/components/customer/PriceRangeSlider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import toast from 'react-hot-toast';

function FilterSidebar({ filters, onChange, categories, brands }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Categories</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {categories.map((cat) => (
            <label key={cat._id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground">
              <input
                type="checkbox"
                checked={filters.category === cat._id}
                onChange={() => onChange({ category: filters.category === cat._id ? '' : cat._id })}
                className="rounded"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Brands</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {brands.map((b) => (
            <label key={b._id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground">
              <input
                type="checkbox"
                checked={filters.brand === b._id}
                onChange={() => onChange({ brand: filters.brand === b._id ? '' : b._id })}
                className="rounded"
              />
              {b.name}
            </label>
          ))}
        </div>
      </div>

      <PriceRangeSlider
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onChange={(v) => onChange(v)}
      />
    </div>
  );
}

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ProductListing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page'), 10) || 1,
    view: searchParams.get('view') || 'grid',
  });

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const updateFilter = useCallback((updates) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates, page: updates.page ?? 1 };
      const params = new URLSearchParams();
      Object.entries(next).forEach(([key, val]) => {
        if (val && val !== '' && val !== 'grid') params.set(key, val);
      });
      setSearchParams(params, { replace: true });
      return next;
    });
  }, [setSearchParams]);

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate(`/account/login?redirect=/products`);
      return;
    }
    try {
      await dispatch(addToCart({ productId: product._id })).unwrap();
      toast.success(`Added ${product.name} to cart`);
    } catch (err) {
      toast.error(err?.message || 'Failed to add to cart');
    }
  };

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'public'],
    queryFn: () => categoryApi.getAll(),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.getAll(),
  });

  const queryParams = {
    page: filters.page,
    limit: 12,
    sortBy: filters.sortBy,
  };
  if (filters.search) queryParams.search = filters.search;
  if (filters.category) queryParams.category = filters.category;
  if (filters.brand) queryParams.brand = filters.brand;
  if (filters.minPrice) queryParams.minPrice = filters.minPrice;
  if (filters.maxPrice) queryParams.maxPrice = filters.maxPrice;

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'public', queryParams],
    queryFn: () => customerApi.getProductListing(queryParams),
  });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];
  const products = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  const clearFilters = () => {
    setFilters({
      search: '', category: '', brand: '', minPrice: '', maxPrice: '',
      sortBy: 'newest', page: 1, view: 'grid',
    });
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = filters.search || filters.category || filters.brand || filters.minPrice || filters.maxPrice;

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  const sidebarContent = (
    <FilterSidebar
      filters={filters}
      onChange={(updates) => updateFilter(updates)}
      categories={categories}
      brands={brands}
    />
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput
            value={filters.search}
            onChange={(v) => updateFilter({ search: v })}
            placeholder="Search products..."
          />
        </div>

        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter({ sortBy: e.target.value })}
          className="rounded-md border bg-background px-3 py-2 text-sm h-9"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex items-center border rounded-md h-9">
          <button
            onClick={() => updateFilter({ view: 'grid' })}
            className={`px-2 h-full flex items-center ${filters.view === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
          >
            <Grid3X3 className="size-4" />
          </button>
          <button
            onClick={() => updateFilter({ view: 'list' })}
            className={`px-2 h-full flex items-center ${filters.view === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
          >
            <List className="size-4" />
          </button>
        </div>

        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden h-9">
              <SlidersHorizontal className="size-4 mr-1" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {sidebarContent}
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="size-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 flex-shrink-0">
          {sidebarContent}
        </aside>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <ProductSkeletonGrid />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-lg mb-1">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{meta.total} product{meta.total !== 1 ? 's' : ''} found</p>
              <div className={
                filters.view === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
                  : 'space-y-3'
              }>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} view={filters.view} onAddToCart={handleAddToCart} />
                ))}
              </div>
              {meta.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    page={meta.page}
                    totalPages={meta.totalPages}
                    total={meta.total}
                    onChange={(p) => updateFilter({ page: p })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductListing;
