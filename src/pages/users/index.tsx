import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { withAuth } from '../../components/withAuth';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

function UsersPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    email: string; password: string; firstName: string; lastName: string;
  }>();

  const { data, isLoading } = useQuery({
    queryKey: ['users', role],
    queryFn: () => api.get(`/users?role=${role}&limit=50`).then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/approve`),
    onSuccess: () => { toast.success('User approved'); qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  const createInstructorMutation = useMutation({
    mutationFn: (dto: any) => api.post('/users/instructors', dto),
    onSuccess: () => {
      toast.success('Instructor created');
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed'),
  });

  const users = data?.data || [];

  const ROLE_BADGES: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    INSTRUCTOR: 'bg-blue-100 text-blue-800',
    STUDENT: 'bg-slate-100 text-slate-700',
  };

  return (
    <Layout title="Users">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Users</h2>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
            + Create Instructor
          </button>
        </div>

        {showCreate && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Create Instructor Account</h3>
            <form onSubmit={handleSubmit(d => createInstructorMutation.mutate(d))} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input {...register('firstName', { required: 'Required' })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input {...register('lastName', { required: 'Required' })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" {...register('email', { required: 'Required' })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8' } })} className="input" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" disabled={createInstructorMutation.isPending} className="btn-primary">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {['', 'ADMIN', 'INSTRUCTOR', 'STUDENT'].map(r => (
            <button key={r} onClick={() => setRole(r)} className={`btn-sm ${role === r ? 'btn-primary' : 'btn-secondary'}`}>
              {r || 'All'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="card p-4 h-16 animate-pulse bg-slate-100" />)}</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ROLE_BADGES[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-700'}`}>
                        {u.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      {!u.isApproved && (
                        <button
                          onClick={() => approveMutation.mutate(u.id)}
                          disabled={approveMutation.isPending}
                          className="btn-primary btn-sm"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-center py-10 text-slate-400">No users found</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(UsersPage, ['ADMIN']);
