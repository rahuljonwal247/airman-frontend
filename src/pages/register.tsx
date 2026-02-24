import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSlug: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<{ id: string; name: string; slug: string }[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();

  useEffect(() => {
    api.get('/tenants').then(({ data }) => setTenants(data.data)).catch(() => {});
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      toast.success('Registration submitted! Await admin approval.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✈️</div>
          <h1 className="text-3xl font-bold text-white">AIRMAN</h1>
          <p className="text-slate-400 mt-1 text-sm">Student Registration</p>
        </div>

        <div className="card p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Create account</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Flight School</label>
              <select {...register('tenantSlug', { required: 'Required' })} className="input">
                <option value="">Select...</option>
                {tenants.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
              </select>
              {errors.tenantSlug && <p className="text-red-500 text-xs mt-1">{errors.tenantSlug.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
                <input {...register('firstName', { required: 'Required' })} className="input" />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
                <input {...register('lastName', { required: 'Required' })} className="input" />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" {...register('email', { required: 'Required' })} className="input" placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" {...register('password', {
                required: 'Required',
                minLength: { value: 8, message: 'Min 8 chars' },
                pattern: { value: /(?=.*[A-Z])(?=.*[0-9])/, message: 'Must include uppercase & number' }
              })} className="input" placeholder="••••••••" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/login" className="text-sm text-blue-600 hover:underline">Already have an account?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
