import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

interface LoginForm {
  email: string;
  password: string;
  tenantSlug: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { tenantSlug: '' },
  });

  useEffect(() => {
    if (user) { router.replace('/dashboard'); return; }
    api.get('/tenants').then(({ data }) => setTenants(data.data)).catch(() => {});
  }, [user]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password, data.tenantSlug);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✈️</div>
          <h1 className="text-3xl font-bold text-white">AIRMAN</h1>
          <p className="text-slate-400 mt-1 text-sm">Aviation Learning & Scheduling</p>
        </div>

        <div className="card p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign in</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Flight School</label>
              <select {...register('tenantSlug', { required: 'Select a school' })} className="input">
                <option value="">Select school...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
              {errors.tenantSlug && <p className="text-red-500 text-xs mt-1">{errors.tenantSlug.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email required' })}
                className="input"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password required' })}
                className="input"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/register" className="text-sm text-blue-600 hover:underline">
              New student? Register here
            </a>
          </div>
        </div>

        {/* Demo creds */}
        <div className="mt-4 card p-4 text-xs text-slate-500">
          <p className="font-medium text-slate-600 mb-2">Demo Credentials (Alpha Flight School):</p>
          <p>Admin: admin@alpha.com / Admin@123</p>
          <p>Instructor: instructor@alpha.com / Instructor@123</p>
          <p>Student: student@alpha.com / Student@123</p>
        </div>
      </div>
    </div>
  );
}
