import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { billingApi } from '@/api/billing.api';

export default function POSSearch({ onAddItem }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await billingApi.searchProducts(q);
      setResults(data || []);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      onAddItem(results[selectedIndex]);
      setQuery('');
      setResults([]);
      inputRef.current?.focus();
    }
  };

  const handleSelect = (product) => {
    onAddItem(product);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search by code, SKU, or name..."
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
          {results.map((product, idx) => (
            <button
              key={product._id}
              onClick={() => handleSelect(product)}
              className={`w-full flex items-center gap-3 p-3 text-left hover:bg-accent transition-colors ${
                idx === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <div className="size-10 rounded bg-muted flex items-center justify-center shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="size-10 object-cover rounded" />
                ) : (
                  <Package className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.code} | SKU: {product.sku}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold">₹{product.sellingPrice}</p>
                <span className={`text-xs ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && query.length > 0 && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
      )}
    </div>
  );
}
