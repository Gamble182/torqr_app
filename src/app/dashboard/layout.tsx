import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardNav } from '@/components/DashboardNav';
import { CompanyNameSetupModal } from '@/components/CompanyNameSetupModal';
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
          <CompanyNameSetupModal />
          {/* Mobile: top padding for fixed mobile bar */}
          {/* Desktop: left margin for sidebar */}
          <main className="pt-14 lg:pt-0 lg:pl-65 transition-all duration-200">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
