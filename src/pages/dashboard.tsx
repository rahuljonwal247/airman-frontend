import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { withAuth } from '../components/withAuth';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

function StatCard({ label, value, icon, href }: { label: string; value: number | string; icon: string; href?: string }) {
  const content = (
    <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function BadgeStatus({ status }: { status: string }) {
  const colors: Record<string, string> = {
    REQUESTED: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-slate-100 text-slate-700',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return <span className={`badge ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
}

function Dashboard() {
  const { user, isAdmin, isInstructor } = useAuth();

  const { data: bookingsData } = useQuery({
    queryKey: ['dashboard-bookings'],
    queryFn: () => api.get('/bookings?limit=5').then(r => r.data),
  });

  const { data: coursesData } = useQuery({
    queryKey: ['dashboard-courses'],
    queryFn: () => api.get('/courses?limit=4').then(r => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => api.get('/users?limit=5').then(r => r.data),
    enabled: isAdmin,
  });

  const bookings = bookingsData?.data || [];
  const courses = coursesData?.data || [];
  const users = usersData?.data || [];

  const pendingBookings = bookings.filter((b: any) => b.status === 'REQUESTED').length;
  const pendingUsers = users.filter((u: any) => !u.isApproved).length;

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Welcome back, {user?.firstName}! 👋
          </h2>
          <p className="text-slate-500 mt-1">Here's what's happening today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Courses" value={coursesData?.meta?.total ?? '—'} icon="📚" href="/courses" />
          <StatCard label="Bookings" value={bookingsData?.meta?.total ?? '—'} icon="📅" href="/bookings" />
          {isAdmin && <StatCard label="Pending Approvals" value={pendingUsers} icon="⏳" href="/users" />}
          {(isAdmin || isInstructor) && <StatCard label="Pending Bookings" value={pendingBookings} icon="🔔" href="/bookings" />}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Recent Bookings</h3>
              <Link href="/bookings" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {bookings.length === 0 && (
                <p className="px-5 py-8 text-center text-slate-400 text-sm">No bookings yet</p>
              )}
              {bookings.map((b: any) => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{b.title}</div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(b.startTime), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  <BadgeStatus status={b.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Courses</h3>
              <Link href="/courses" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {courses.length === 0 && (
                <p className="px-5 py-8 text-center text-slate-400 text-sm">No courses available</p>
              )}
              {courses.map((c: any) => (
                <Link key={c.id} href={`/courses/${c.id}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{c.title}</div>
                    <div className="text-xs text-slate-500">
                      {c.instructor?.firstName} {c.instructor?.lastName} · {c._count?.modules} modules
                    </div>
                  </div>
                  <span className="text-slate-400 text-sm">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Dashboard);
