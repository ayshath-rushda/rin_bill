import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const presets = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1000', min: 500, max: 1000 },
  { label: '₹1000 – ₹5000', min: 1000, max: 5000 },
  { label: '₹5000+', min: 5000, max: null },
];

function PriceRangeSlider({ minPrice, maxPrice, onChange }) {
  const [min, setMin] = useState(minPrice || '');
  const [max, setMax] = useState(maxPrice || '');

  const handleApply = () => {
    onChange({
      minPrice: min === '' ? null : Number(min),
      maxPrice: max === '' ? null : Number(max),
    });
  };

  const handlePreset = (preset) => {
    setMin(preset.min || '');
    setMax(preset.max ?? '');
    onChange({ minPrice: preset.min || null, maxPrice: preset.max });
  };

  const handleClear = () => {
    setMin('');
    setMax('');
    onChange({ minPrice: null, maxPrice: null });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Price Range</h4>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="h-8 text-xs"
          min={0}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="h-8 text-xs"
          min={0}
        />
      </div>
      <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={handleApply}>
        Apply
      </Button>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className="rounded-md border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      {(min || max) && (
        <button
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear price filter
        </button>
      )}
    </div>
  );
}

export default PriceRangeSlider;
