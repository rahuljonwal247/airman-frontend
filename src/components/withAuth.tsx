import { useRouter } from 'next/router';
import { useEffect, ComponentType } from 'react';
import { useAuth } from '../lib/auth';

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedRoles?: string[]
) {
  return function ProtectedPage(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace('/dashboard');
      }
    }, [user, loading]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-white text-lg animate-pulse">Loading...</div>
        </div>
      );
    }

    if (!user) return null;
    if (allowedRoles && !allowedRoles.includes(user.role)) return null;

    return <WrappedComponent {...props} />;
  };
}
