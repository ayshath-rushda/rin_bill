import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const initialState = {
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  isDefault: false,
};

function AddressForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState(initialData || initialState);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.line1.trim()) errs.line1 = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = 'Enter a valid 6-digit pincode';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const labelOptions = ['Home', 'Office', 'Other'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        {labelOptions.map((l) => (
          <Button
            key={l}
            type="button"
            variant={form.label === l ? 'default' : 'outline'}
            size="sm"
            onClick={() => update('label', l)}
          >
            {l}
          </Button>
        ))}
      </div>

      <div>
        <Label htmlFor="line1">Address Line 1</Label>
        <Input id="line1" value={form.line1} onChange={(e) => update('line1', e.target.value)} placeholder="Street, building, area" />
        {errors.line1 && <p className="text-sm text-destructive mt-1">{errors.line1}</p>}
      </div>

      <div>
        <Label htmlFor="line2">Address Line 2 (optional)</Label>
        <Input id="line2" value={form.line2} onChange={(e) => update('line2', e.target.value)} placeholder="Landmark, etc." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={form.city} onChange={(e) => update('city', e.target.value)} />
          {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" value={form.state} onChange={(e) => update('state', e.target.value)} />
          {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} maxLength={6} placeholder="6-digit pincode" />
          {errors.pincode && <p className="text-sm text-destructive mt-1">{errors.pincode}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
        </div>
      </div>

      {!initialData?.isDefault && (
        <div className="flex items-center gap-2">
          <Checkbox id="isDefault" checked={form.isDefault} onCheckedChange={(v) => update('isDefault', v)} />
          <Label htmlFor="isDefault" className="text-sm">Set as default address</Label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Address'}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

export default AddressForm;
