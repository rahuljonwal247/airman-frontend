import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { withAuth } from '../../components/withAuth';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

function CourseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAdmin, isInstructor } = useAuth();
  const qc = useQueryClient();
  const [addingModule, setAddingModule] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const { register: regMod, handleSubmit: hsMod, reset: resetMod } = useForm<{ title: string }>();
  const { register: regLesson, handleSubmit: hsLesson, reset: resetLesson } = useForm<{ title: string; type: string; content: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const publishMutation = useMutation({
    mutationFn: () => api.patch(`/courses/${id}`, { isPublished: !data?.isPublished }),
    onSuccess: () => { toast.success('Updated!'); qc.invalidateQueries({ queryKey: ['course', id] }); },
  });

  const addModuleMutation = useMutation({
    mutationFn: (dto: { title: string }) => api.post(`/courses/${id}/modules`, dto),
    onSuccess: () => { toast.success('Module added'); qc.invalidateQueries({ queryKey: ['course', id] }); setAddingModule(false); resetMod(); },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed'),
  });

  const addLessonMutation = useMutation({
    mutationFn: ({ moduleId, dto }: any) => api.post(`/courses/${id}/modules/${moduleId}/lessons`, dto),
    onSuccess: () => { toast.success('Lesson added'); qc.invalidateQueries({ queryKey: ['course', id] }); setAddingLesson(null); resetLesson(); },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed'),
  });

  if (isLoading) return <Layout title="Course"><div className="animate-pulse p-8 text-slate-400">Loading...</div></Layout>;
  if (!data) return <Layout title="Not Found"><div className="p-8">Course not found</div></Layout>;

  const canManage = isAdmin || isInstructor;

  return (
    <Layout title={data.title}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {!data.isPublished && <span className="badge bg-amber-100 text-amber-700">Draft</span>}
                {data.isPublished && <span className="badge bg-green-100 text-green-700">Published</span>}
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{data.title}</h1>
              {data.description && <p className="text-slate-500 mt-2">{data.description}</p>}
              <p className="text-sm text-slate-400 mt-3">
                Instructor: {data.instructor?.firstName} {data.instructor?.lastName}
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className={data.isPublished ? 'btn-secondary' : 'btn-primary'}
              >
                {data.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            )}
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Modules ({data.modules?.length || 0})</h2>
            {canManage && (
              <button onClick={() => setAddingModule(true)} className="btn-primary btn-sm">+ Add Module</button>
            )}
          </div>

          {addingModule && (
            <div className="card p-4">
              <form onSubmit={hsMod((d) => addModuleMutation.mutate(d))} className="flex gap-2">
                <input {...regMod('title', { required: true })} placeholder="Module title" className="input flex-1" />
                <button type="submit" disabled={addModuleMutation.isPending} className="btn-primary btn-sm">Add</button>
                <button type="button" onClick={() => setAddingModule(false)} className="btn-secondary btn-sm">Cancel</button>
              </form>
            </div>
          )}

          {data.modules?.map((mod: any) => (
            <div key={mod.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-800">{mod.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{mod.lessons?.length || 0} lessons</span>
                  <span className="text-slate-400">{expandedModule === mod.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedModule === mod.id && (
                <div className="border-t border-slate-100">
                  {mod.lessons?.map((lesson: any) => (
                    <Link key={lesson.id} href={`/courses/${id}/lessons/${lesson.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50">
                      <span>{lesson.type === 'QUIZ' ? '📝' : '📄'}</span>
                      <span className="text-sm text-slate-700">{lesson.title}</span>
                      <span className="ml-auto text-xs text-slate-400 uppercase">{lesson.type}</span>
                    </Link>
                  ))}

                  {canManage && (
                    <div className="px-5 py-3">
                      {addingLesson === mod.id ? (
                        <form onSubmit={hsLesson((d) => addLessonMutation.mutate({ moduleId: mod.id, dto: d }))} className="space-y-2">
                          <input {...regLesson('title', { required: true })} placeholder="Lesson title" className="input text-sm" />
                          <select {...regLesson('type', { required: true })} className="input text-sm">
                            <option value="TEXT">Text Lesson</option>
                            <option value="QUIZ">Quiz</option>
                          </select>
                          <div className="flex gap-2">
                            <button type="submit" disabled={addLessonMutation.isPending} className="btn-primary btn-sm">Add</button>
                            <button type="button" onClick={() => setAddingLesson(null)} className="btn-secondary btn-sm">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => setAddingLesson(mod.id)} className="text-sm text-blue-600 hover:underline">
                          + Add Lesson
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {data.modules?.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <p>No modules yet{canManage ? '. Add one above.' : '.'}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(CourseDetailPage);
