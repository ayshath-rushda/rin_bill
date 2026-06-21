import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

function SearchInput({ value: externalValue, onChange, placeholder = 'Search...', debounceMs = 400 }) {
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const timerRef = useRef(null);

  useEffect(() => {
    setInternalValue(externalValue || '');
  }, [externalValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInternalValue(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, debounceMs);
  };

  const handleClear = () => {
    setInternalValue('');
    clearTimeout(timerRef.current);
    onChange('');
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="relative">
      <Input
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pr-8"
      />
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          \u2715
        </button>
      )}
    </div>
  );
}

export default SearchInput;
