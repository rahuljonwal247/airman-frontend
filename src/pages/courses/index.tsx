import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { withAuth } from '../../components/withAuth';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface Course {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  instructor: { id: string; firstName: string; lastName: string };
  _count: { modules: number };
}

interface CreateCourseForm {
  title: string;
  description: string;
  instructorId: string;
}

function Courses() {
  const { isAdmin, isInstructor, user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCourseForm>();

  const { data: instructorsData } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => api.get('/users/instructors').then(r => r.data),
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page, search],
    queryFn: () => api.get(`/courses?page=${page}&limit=12&search=${search}`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => api.post('/courses', dto),
    onSuccess: () => {
      toast.success('Course created!');
      qc.invalidateQueries({ queryKey: ['courses'] });
      setShowCreate(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed'),
  });

  const onSubmit = (data: CreateCourseForm) => {
    createMutation.mutate({
      ...data,
      instructorId: data.instructorId || user?.id,
    });
  };

  const courses: Course[] = data?.data || [];
  const meta = data?.meta;

  return (
    <Layout title="Courses">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Courses</h2>
            <p className="text-slate-500 text-sm">
              {meta?.total ?? 0} course{meta?.total !== 1 ? 's' : ''} available
            </p>
          </div>
          {(isAdmin || isInstructor) && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              + New Course
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input max-w-sm"
        />

        {/* Create form */}
        {showCreate && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Create New Course</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input {...register('title', { required: 'Required' })} className="input" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea {...register('description')} className="input" rows={3} />
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instructor</label>
                  <select {...register('instructorId')} className="input">
                    <option value="">Assign to myself</option>
                    {instructorsData?.data?.map((i: any) => (
                      <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Creating...' : 'Create Course'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Course grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="card p-6 h-40 animate-pulse bg-slate-100" />)}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              {courses.map((c) => (
                <Link key={c.id} href={`/courses/${c.id}`}
                  className="card p-5 hover:shadow-md transition-shadow cursor-pointer block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">📘</div>
                    {!c.isPublished && (
                      <span className="badge bg-amber-100 text-amber-700">Draft</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{c.title}</h3>
                  {c.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{c.description}</p>
                  )}
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-auto">
                    <span>👤 {c.instructor?.firstName} {c.instructor?.lastName}</span>
                    <span>📁 {c._count?.modules} modules</span>
                  </div>
                </Link>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <div className="text-4xl mb-3">📚</div>
                <p>No courses found{search ? ` for "${search}"` : ''}</p>
              </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">
                  ← Prev
                </button>
                <span className="text-sm text-slate-600">Page {page} of {meta.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-secondary btn-sm">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(Courses);
