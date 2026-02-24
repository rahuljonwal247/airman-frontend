import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { withAuth } from '../../components/withAuth';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

function AvailabilityPage() {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    startTime: string; endTime: string; isRecurring: boolean;
  }>();

  const { data, isLoading } = useQuery({
    queryKey: ['availability'],
    queryFn: () => api.get('/availability').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => api.post('/availability', dto),
    onSuccess: () => {
      toast.success('Availability slot added');
      qc.invalidateQueries({ queryKey: ['availability'] });
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/availability/${id}`),
    onSuccess: () => {
      toast.success('Slot removed');
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const slots = data?.data || [];

  return (
    <Layout title="My Availability">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Manage Availability</h2>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Add Availability Slot</h3>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                <input type="datetime-local" {...register('startTime', { required: 'Required' })} className="input" />
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                <input type="datetime-local" {...register('endTime', { required: 'Required' })} className="input" />
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('isRecurring')} className="rounded" />
              Recurring weekly
            </label>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Adding...' : 'Add Slot'}
            </button>
          </form>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Upcoming Availability</h3>
          </div>
          {isLoading && <div className="p-8 animate-pulse text-slate-400">Loading...</div>}
          <div className="divide-y divide-slate-100">
            {slots.map((s: any) => (
              <div key={s.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {format(new Date(s.startTime), 'EEE, MMM d')}
                  </div>
                  <div className="text-xs text-slate-500">
                    {format(new Date(s.startTime), 'HH:mm')} – {format(new Date(s.endTime), 'HH:mm')}
                    {s.isRecurring && ' · Recurring'}
                  </div>
                  {s.instructor && (
                    <div className="text-xs text-slate-400">
                      {s.instructor.firstName} {s.instructor.lastName}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(s.id)}
                  disabled={deleteMutation.isPending}
                  className="btn-danger btn-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            {!isLoading && slots.length === 0 && (
              <p className="text-center py-10 text-slate-400">No availability slots set</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(AvailabilityPage, ['INSTRUCTOR', 'ADMIN']);
