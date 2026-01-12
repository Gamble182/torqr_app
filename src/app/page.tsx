import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();

  // If user is already logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900">
              Willkommen bei <span className="text-blue-600">Torqr</span>
            </h1>
            <p className="text-xl text-gray-600">
              Der Hebel für Ihr Handwerk
            </p>
          </div>

          <p className="mx-auto max-w-2xl text-lg text-gray-700">
            Verwalten Sie Ihre Wartungspläne für Heizungen, überwachen Sie Kundenheizungen
            und automatisieren Sie Ihren Workflow mit unserer leistungsstarken Plattform,
            die speziell für Heizungstechniker entwickelt wurde.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Loslegen
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Anmelden
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Kunden verfolgen
              </h3>
              <p className="text-sm text-gray-600">
                Verwalten Sie alle Ihre Kunden und deren Heizungsinformationen an einem Ort
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Wartung planen
              </h3>
              <p className="text-sm text-gray-600">
                Automatische Erinnerungen stellen sicher, dass Sie keinen Wartungstermin verpassen
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Zeit sparen
              </h3>
              <p className="text-sm text-gray-600">
                Reduzieren Sie administrative Arbeiten um bis zu 75% und konzentrieren Sie sich auf das Wesentliche
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
