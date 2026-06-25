import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { customerApi } from '@/api/customer.api';
import ProductCard from '@/components/customer/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function SliderSection({ sliders }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((s) => (s === sliders.length - 1 ? 0 : s + 1));
  }, [sliders.length]);

  useEffect(() => {
    if (sliders.length < 2) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [sliders.length, next]);

  if (sliders.length === 0) return null;

  const slide = sliders[current];

  return (
    <section className="relative w-full overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: '21/9' }}>
      <img
        src={slide.bannerImage}
        alt={slide.title}
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-12 text-white max-w-lg">
        <h2 className="text-2xl md:text-4xl font-bold leading-tight">{slide.title}</h2>
        {slide.subtitle && <p className="mt-2 text-sm md:text-base text-white/80">{slide.subtitle}</p>}
        {slide.buttonText && slide.buttonUrl && (
          <Link to={slide.buttonUrl} className="mt-4">
            <Button variant="default" size="lg" className="bg-white text-black hover:bg-white/90">
              {slide.buttonText}
            </Button>
          </Link>
        )}
      </div>
      {sliders.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((s) => (s === 0 ? sliders.length - 1 : s - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-white hover:bg-background/40 transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-white hover:bg-background/40 transition-colors"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {sliders.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`size-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ProductRow({ title, products, loading, linkTo }) {
  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="text-sm text-primary hover:underline">
            View All
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}

function CategoryGrid({ categories, loading }) {
  if (loading) {
    return (
      <section>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mb-4">Top Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            to={`/products?category=${cat._id}`}
            className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
          >
            {cat.image ? (
              <img src={cat.image} alt={cat.name} className="size-full object-cover transition-transform group-hover:scale-110" />
            ) : (
              <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                <span className="text-3xl font-bold text-primary/40">{cat.name[0]}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-2 left-2 right-2 text-white text-sm font-semibold truncate">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BannerSection({ banners }) {
  if (!banners || banners.length === 0) return null;

  const byPosition = { top: [], middle: [], bottom: [] };
  banners.forEach((b) => { byPosition[b.position]?.push(b); });

  return (
    <section className="space-y-4">
      {['top', 'middle', 'bottom'].map((pos) => {
        const items = byPosition[pos];
        if (!items || items.length === 0) return null;
        return (
          <div key={pos} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((banner) => (
              <Link
                key={banner._id}
                to={banner.url || '#'}
                className="relative aspect-[3/1] rounded-xl overflow-hidden bg-muted group"
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
                {banner.title && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center">
                    <h3 className="text-white text-lg md:text-xl font-bold px-6">{banner.title}</h3>
                  </div>
                )}
              </Link>
            ))}
          </div>
        );
      })}
    </section>
  );
}

function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['homepage'],
    queryFn: customerApi.getHomepageData,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">Failed to load homepage content</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const isLoadingAll = isLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      <SliderSection sliders={data?.sliders || []} />

      {data?.featuredProducts?.featured?.length > 0 && (
        <ProductRow
          title="Featured Products"
          products={data.featuredProducts.featured.map((fp) => fp.product || fp)}
          loading={isLoadingAll}
          linkTo="/products"
        />
      )}

      <CategoryGrid categories={data?.categories} loading={isLoadingAll} />

      {data?.newArrivals?.length > 0 && (
        <ProductRow
          title="New Arrivals"
          products={data.newArrivals}
          loading={isLoadingAll}
          linkTo="/products?sortBy=newest"
        />
      )}

      {data?.featuredProducts?.best_seller?.length > 0 && (
        <ProductRow
          title="Best Sellers"
          products={data.featuredProducts.best_seller.map((fp) => fp.product || fp)}
          loading={isLoadingAll}
          linkTo="/products"
        />
      )}

      <BannerSection banners={data?.banners} />
    </div>
  );
}

export default HomePage;
