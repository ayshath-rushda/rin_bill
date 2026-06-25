import { Link } from 'react-router-dom';
import { ShoppingCart, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const stockLabel = (stock, lowStockLimit) => {
  if (stock === 0) return { text: 'Out of Stock', color: 'text-red-500', dot: 'bg-red-500' };
  if (stock <= lowStockLimit) return { text: `Only ${stock} left`, color: 'text-yellow-600', dot: 'bg-yellow-500' };
  return { text: 'In Stock', color: 'text-green-600', dot: 'bg-green-500' };
};

function ProductCard({ product, view = 'grid', onAddToCart }) {
  const stock = product.stock ?? 0;
  const limit = product.lowStockLimit ?? 5;
  const status = stockLabel(stock, limit);
  const image = product.images?.[0];
  const hasDiscount = product.costPrice && product.sellingPrice < product.costPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.costPrice - product.sellingPrice) / product.costPrice) * 100)
    : 0;

  if (view === 'list') {
    return (
      <Link
        to={`/products/${product.slug || product._id}`}
        className="flex gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
      >
        <div className="flex-shrink-0 size-28 rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {image ? (
            <img src={image} alt={product.name} className="size-full object-cover" />
          ) : (
            <ImageOff className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.shortDescription}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold">₹{product.sellingPrice?.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">₹{product.costPrice?.toLocaleString()}</span>
            )}
            {discountPercent > 0 && (
              <Badge variant="destructive" className="text-xs">{discountPercent}% OFF</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={cn('size-2 rounded-full', status.dot)} />
            <span className={cn('text-xs', status.color)}>{status.text}</span>
          </div>
        </div>
        <div className="flex-shrink-0 self-center">
          <Button size="sm" disabled={stock === 0} onClick={(e) => { e.preventDefault(); onAddToCart?.(product); }}>
            <ShoppingCart className="size-4 mr-1" />
            Add
          </Button>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/products/${product.slug || product._id}`}
      className="group flex flex-col rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <ImageOff className="size-12 text-muted-foreground" />
        )}
        {discountPercent > 0 && (
          <Badge variant="destructive" className="absolute top-2 left-2 text-xs">{discountPercent}% OFF</Badge>
        )}
        {stock === 0 && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="flex flex-col p-3 gap-1 flex-1">
        {product.category && (
          <span className="text-xs text-muted-foreground truncate">{product.category.name}</span>
        )}
        <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{product.name}</h3>
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-base font-bold">₹{product.sellingPrice?.toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">₹{product.costPrice?.toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={cn('size-1.5 rounded-full', status.dot)} />
          <span className={cn('text-xs', status.color)}>{status.text}</span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
