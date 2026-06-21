import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    if (!form.email) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Invalid email format';
    return null;
  };

  const validateStep2 = () => {
    if (!form.otp || form.otp.length !== 6) return 'OTP must be 6 digits';
    return null;
  };

  const validateStep3 = () => {
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSendOtp = async () => {
    const error = validateStep1();
    if (error) return setErrors({ email: error });
    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const error = validateStep2();
    if (error) return setErrors({ otp: error });
    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: form.email, otp: form.otp });
      toast.success('OTP verified');
      setStep(3);
    } catch (err) {
      toast.error(err?.error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const error = validateStep3();
    if (error) return setErrors({ password: error });
    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: form.email,
        otp: form.otp,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success('Password reset successfully!');
      navigate('/account/login');
    } catch (err) {
      toast.error(err?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          {step === 1 && 'Enter your email to receive an OTP'}
          {step === 2 && 'Enter the OTP sent to your email'}
          {step === 3 && 'Choose a new password'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <Button className="w-full" onClick={handleSendOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value })}
              />
              {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
            </div>
            <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <Button className="w-full" onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep(2)}
              disabled={loading}
            >
              Back
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link to="/account/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default ForgotPasswordPage;
