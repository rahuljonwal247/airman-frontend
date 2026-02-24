import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { withAuth } from '../../components/withAuth';
import api from '../../lib/api';
import { format } from 'date-fns';

function AuditPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page],
    queryFn: () => api.get(`/audit?page=${page}&limit=30`).then(r => r.data),
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  const ACTION_COLORS: Record<string, string> = {
    USER_LOGIN: 'bg-blue-100 text-blue-700',
    USER_REGISTERED: 'bg-green-100 text-green-700',
    USER_APPROVED: 'bg-green-100 text-green-700',
    BOOKING_CREATED: 'bg-yellow-100 text-yellow-700',
    BOOKING_APPROVED: 'bg-green-100 text-green-700',
    BOOKING_CANCELLED: 'bg-red-100 text-red-700',
    BOOKING_COMPLETED: 'bg-slate-100 text-slate-700',
    BOOKING_ESCALATED: 'bg-orange-100 text-orange-700',
    COURSE_CREATED: 'bg-purple-100 text-purple-700',
    COURSE_UPDATED: 'bg-purple-100 text-purple-700',
    ROLE_CHANGED: 'bg-pink-100 text-pink-700',
  };

  return (
    <Layout title="Audit Log">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Audit Log</h2>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="card p-4 h-12 animate-pulse bg-slate-100" />)}</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MMM d HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {log.resource}{log.resourceId ? `:${log.resourceId.slice(0, 8)}` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                      {log.correlationId?.slice(0, 12) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <p className="text-center py-10 text-slate-400">No audit logs yet</p>}
          </div>
        )}

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

export default withAuth(AuditPage, ['ADMIN']);
