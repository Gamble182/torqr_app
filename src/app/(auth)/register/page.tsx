'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Loader2Icon, AlertCircleIcon } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  phone: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          setError(result.details.map((d: { message: string }) => d.message).join(', '));
        } else {
          setError(result.error || 'Registrierung fehlgeschlagen');
        }
        return;
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      console.error('Registration error:', err);
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
            Starten Sie noch heute
          </h2>
          <p className="text-white/70 leading-relaxed">
            Erstellen Sie Ihr kostenloses Konto und bringen Sie Struktur in
            Ihren Handwerksbetrieb.
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
              <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
              <CardDescription>
                Geben Sie Ihre Daten ein, um sich zu registrieren
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="px-0 space-y-4">
                {error && (
                  <div className="flex items-start gap-3 rounded-lg bg-status-overdue-bg border border-status-overdue-border p-3 text-sm text-status-overdue-text">
                    <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Vollständiger Name</Label>
                  <Input
                    id="name"
                    placeholder="Max Mustermann"
                    {...register('name')}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

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
                  <Label htmlFor="password">Passwort</Label>
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
                  <p className="text-xs text-muted-foreground">
                    Mind. 8 Zeichen mit Groß-, Kleinbuchstaben und einer Zahl
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+49 123 456789"
                    {...register('phone')}
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 px-0 pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
                  {isLoading ? 'Konto wird erstellt...' : 'Konto erstellen'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Bereits ein Konto?{' '}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Anmelden
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
