import { auth, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {session.user.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {session.user.email}
            </div>
            <div>
              <span className="font-medium">User ID:</span> {session.user.id}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>What you can do next</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Add Customers</h3>
              <p className="text-sm text-gray-600">
                Start by adding your customers and their heater information
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Schedule Maintenance</h3>
              <p className="text-sm text-gray-600">
                Set up maintenance schedules for your customers&apos; heaters
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Track Work</h3>
              <p className="text-sm text-gray-600">
                Log completed maintenance work with photos and notes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
