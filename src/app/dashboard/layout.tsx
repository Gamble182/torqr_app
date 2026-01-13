import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardNav } from '@/components/DashboardNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <DashboardNav />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
