import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { withAuth } from '../../components/withAuth';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format, startOfWeek, addDays } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-800',
};

interface BookingForm {
  title: string;
  startTime: string;
  endTime: string;
  instructorId: string;
  notes: string;
}

function BookingsPage() {
  const { isAdmin, isInstructor, user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookingForm>();

  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const weekEnd = addDays(weekStart, 6);

  const { data: instructorsData } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => api.get('/users/instructors').then(r => r.data),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookings', page, status, weekOffset],
    queryFn: () => api.get(`/bookings?page=${page}&limit=20&status=${status}&startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => api.post('/bookings', dto),
    onSuccess: () => {
      toast.success('Booking requested!');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setShowCreate(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed'),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: any }) =>
      api.post(`/bookings/${id}/${action}`, body || {}),
    onSuccess: (_, vars) => {
      toast.success(`Booking ${vars.action}d!`);
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed'),
  });

  const bookings = data?.data || [];
  const meta = data?.meta;

  return (
    <Layout title="Bookings">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Bookings</h2>
            <p className="text-slate-500 text-sm">{meta?.total ?? 0} total</p>
          </div>
          {!isInstructor && (
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
              + Request Booking
            </button>
          )}
        </div>

        {/* Week Navigator */}
        <div className="card p-4 flex items-center justify-between">
          <button onClick={() => setWeekOffset(w => w - 1)} className="btn-secondary btn-sm">← Prev Week</button>
          <span className="text-sm font-medium text-slate-700">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="btn-secondary btn-sm">Next Week →</button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Request a Booking</h3>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Title / Purpose</label>
                <input {...register('title', { required: 'Required' })} placeholder="e.g. Pre-solo review" className="input" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                <input type="datetime-local" {...register('startTime', { required: 'Required' })} className="input" />
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                <input type="datetime-local" {...register('endTime', { required: 'Required' })} className="input" />
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Instructor (optional)</label>
                <select {...register('instructorId')} className="input">
                  <option value="">Any available</option>
                  {instructorsData?.data?.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <input {...register('notes')} placeholder="Any special requests..." className="input" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Requesting...' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {['', 'REQUESTED', 'APPROVED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="card p-5 h-20 animate-pulse bg-slate-100" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any) => (
              <div key={b.id} className="card p-5 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-800">{b.title}</span>
                    <span className={`badge ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {format(new Date(b.startTime), 'EEE, MMM d · HH:mm')} → {format(new Date(b.endTime), 'HH:mm')}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Student: {b.student?.firstName} {b.student?.lastName}
                    {b.instructor && ` · Instructor: ${b.instructor?.firstName} ${b.instructor?.lastName}`}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {isAdmin && b.status === 'REQUESTED' && (
                    <button
                      onClick={() => actionMutation.mutate({ id: b.id, action: 'approve' })}
                      className="btn-primary btn-sm"
                    >
                      Approve
                    </button>
                  )}
                  {(isAdmin || isInstructor) && ['APPROVED', 'ASSIGNED'].includes(b.status) && (
                    <button
                      onClick={() => actionMutation.mutate({ id: b.id, action: 'complete' })}
                      className="btn-secondary btn-sm"
                    >
                      Complete
                    </button>
                  )}
                  {!['COMPLETED', 'CANCELLED'].includes(b.status) && (
                    (isAdmin || b.studentId === user?.id) && (
                      <button
                        onClick={() => actionMutation.mutate({ id: b.id, action: 'cancel' })}
                        className="btn-danger btn-sm"
                      >
                        Cancel
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}

            {bookings.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <div className="text-4xl mb-3">📅</div>
                <p>No bookings this week</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">← Prev</button>
            <span className="text-sm text-slate-600">Page {page} of {meta.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-secondary btn-sm">Next →</button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(BookingsPage);
