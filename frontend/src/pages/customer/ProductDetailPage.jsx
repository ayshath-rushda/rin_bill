import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Minus, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { customerApi } from '@/api/customer.api';
import { addToCart } from '@/features/cart/cartSlice';
import ImageGallery from '@/components/customer/ImageGallery';
import ProductCard from '@/components/customer/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => customerApi.getProductDetail(slug),
    enabled: !!slug,
  });

  const { data: related } = useQuery({
    queryKey: ['product', slug, 'related'],
    queryFn: () => customerApi.getRelatedProducts(slug),
    enabled: !!slug,
  });

  if (isLoading) return <DetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Product not found</h2>
        <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild variant="outline"><Link to="/products">Browse Products</Link></Button>
      </div>
    );
  }

  const stock = product.stock ?? 0;
  const limit = product.lowStockLimit ?? 5;
  const hasDiscount = product.costPrice && product.sellingPrice < product.costPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.costPrice - product.sellingPrice) / product.costPrice) * 100)
    : 0;

  const stockStatus = stock === 0
    ? { text: 'Out of Stock', color: 'text-red-500', bg: 'bg-red-50' }
    : stock <= limit
      ? { text: `Only ${stock} left`, color: 'text-yellow-600', bg: 'bg-yellow-50' }
      : { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate(`/account/login?redirect=/products/${slug}`);
      return;
    }
    setAdding(true);
    try {
      await dispatch(addToCart({ productId: product._id, quantity: qty })).unwrap();
      toast.success(`Added ${qty} × ${product.name} to cart`);
    } catch (err) {
      toast.error(err?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const vehicles = product.vehicleCompatibility || [];

  const allImages = [...(product.images || []), ...(product.galleryImages || [])];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3" />
        <Link to="/products" className="hover:text-foreground">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="size-3" />
            <Link to={`/products?category=${product.category._id}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <ImageGallery images={allImages} />

        <div className="space-y-4">
          <div className="flex items-start gap-2 flex-wrap">
            {product.category && (
              <Link to={`/products?category=${product.category._id}`}>
                <Badge variant="secondary" className="text-xs">{product.category.name}</Badge>
              </Link>
            )}
            {product.brand && (
              <Link to={`/products?brand=${product.brand._id}`}>
                <Badge variant="outline" className="text-xs">{product.brand.name}</Badge>
              </Link>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">₹{product.sellingPrice?.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">₹{product.costPrice?.toLocaleString()}</span>
                <Badge variant="destructive" className="text-xs">{discountPercent}% OFF</Badge>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-muted-foreground">{product.shortDescription}</p>
          )}

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${stockStatus.bg}`}>
            <span className={`size-2 rounded-full ${stock === 0 ? 'bg-red-500' : stock <= limit ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span className={stockStatus.color}>{stockStatus.text}</span>
          </div>

          {vehicles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Vehicle Compatibility</h4>
              <div className="flex flex-wrap gap-1.5">
                {vehicles.map((v, i) => (
                  <span key={i} className="rounded-md border bg-muted px-2.5 py-1 text-xs">{v}</span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-md">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="px-3 py-2 hover:bg-accent disabled:opacity-50 transition-colors"
              >
                <Minus className="size-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium min-w-[40px] text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                disabled={qty >= stock}
                className="px-3 py-2 hover:bg-accent disabled:opacity-50 transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1"
              disabled={stock === 0 || adding}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="size-5 mr-2" />
              {stock === 0 ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>

          {product.code && (
            <p className="text-xs text-muted-foreground">Product Code: {product.code}</p>
          )}
        </div>
      </div>

      {product.description && (
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">Description</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
            {product.description}
          </div>
        </section>
      )}

      {related && related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetailPage;
