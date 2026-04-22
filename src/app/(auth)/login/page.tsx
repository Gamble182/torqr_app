'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TorqrWordmark } from '@/components/brand/TorqrIcon';
import { Loader2Icon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Ungültige E-Mail oder Passwort');
        return;
      }

      if (result?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-120 xl:w-140 shrink-0 bg-primary items-center justify-center p-12">
        <div className="max-w-sm">
          <div className="mb-8">
            <TorqrWordmark size="lg" theme="green" />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Heizungswartung
            <br />
            einfach · automatisch
          </h2>
          <p className="text-white/70 leading-relaxed">
            Verwalten Sie Kunden, planen Sie Wartungen und digitalisieren Sie
            Ihren Betrieb — alles an einem Ort.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-105">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <TorqrWordmark size="md" theme="light" />
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl font-bold">Anmelden</CardTitle>
              <CardDescription>
                Melden Sie sich an, um auf Ihr Konto zuzugreifen
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="px-0 space-y-4">
                {registered && (
                  <div className="flex items-start gap-3 rounded-lg bg-status-ok-bg border border-status-ok-border p-3 text-sm text-status-ok-text">
                    <CheckCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                    Registrierung erfolgreich! Bitte melden Sie sich an.
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-3 rounded-lg bg-status-overdue-bg border border-status-overdue-border p-3 text-sm text-status-overdue-text">
                    <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="max@beispiel.de"
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Passwort</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Passwort vergessen?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 px-0 pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
                  {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Noch kein Konto?{' '}
                  <Link href="/register" className="font-medium text-primary hover:underline">
                    Konto erstellen
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
