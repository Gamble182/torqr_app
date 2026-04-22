'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEmployees, useCreateEmployee, useToggleEmployee } from '@/hooks/useEmployees';
import type { Employee, CreateEmployeeInput } from '@/hooks/useEmployees';
import {
  PlusIcon,
  Loader2Icon,
  UserIcon,
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon,
  CopyIcon,
  XIcon,
} from 'lucide-react';

export default function EmployeesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: employees, isLoading, error } = useEmployees();
  const createMutation = useCreateEmployee();
  const toggleMutation = useToggleEmployee();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Redirect non-owners
  if (session?.user?.role !== 'OWNER') {
    router.replace('/dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        Fehler beim Laden der Mitarbeiter
      </div>
    );
  }

  const handleCreate = async (input: CreateEmployeeInput) => {
    const result = await createMutation.mutateAsync(input);
    setShowCreateDialog(false);
    setTempPasswordInfo({
      name: result.name,
      email: result.email,
      password: result.tempPassword,
    });
  };

  const handleToggle = async (employee: Employee) => {
    await toggleMutation.mutateAsync({
      id: employee.id,
      isActive: !employee.isActive,
    });
  };

  const copyPassword = () => {
    if (tempPasswordInfo) {
      navigator.clipboard.writeText(tempPasswordInfo.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeEmployees = employees?.filter((e) => e.isActive) ?? [];
  const inactiveEmployees = employees?.filter((e) => !e.isActive) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verwalten Sie Ihre Techniker und deren Zugriffsrechte
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Neuer Techniker
        </Button>
      </div>

      {/* Active employees */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Aktiv ({activeEmployees.length})
        </h2>
        {activeEmployees.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            Noch keine Mitarbeiter angelegt
          </div>
        ) : (
          <div className="grid gap-3">
            {activeEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                isCurrentUser={emp.id === session?.user?.id}
                onToggle={handleToggle}
                isToggling={toggleMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inactive employees */}
      {inactiveEmployees.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Deaktiviert ({inactiveEmployees.length})
          </h2>
          <div className="grid gap-3">
            {inactiveEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                isCurrentUser={false}
                onToggle={handleToggle}
                isToggling={toggleMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create dialog */}
      {showCreateDialog && (
        <CreateEmployeeDialog
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreate}
          isPending={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}

      {/* Temp password dialog */}
      {tempPasswordInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Techniker angelegt</h3>
              <button onClick={() => setTempPasswordInfo(null)} className="text-muted-foreground hover:text-foreground">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>{tempPasswordInfo.name}</strong> ({tempPasswordInfo.email}) wurde erfolgreich angelegt.
              Teilen Sie das temporäre Passwort mit dem Techniker. Es muss beim ersten Login geändert werden.
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
              <span className="flex-1 select-all">{tempPasswordInfo.password}</span>
              <Button variant="ghost" size="sm" onClick={copyPassword}>
                {copied ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-destructive">
              Dieses Passwort wird nur einmal angezeigt und kann nicht erneut abgerufen werden.
            </p>
            <Button className="w-full" onClick={() => setTempPasswordInfo(null)}>
              Verstanden
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeCard({
  employee,
  isCurrentUser,
  onToggle,
  isToggling,
}: {
  employee: Employee;
  isCurrentUser: boolean;
  onToggle: (emp: Employee) => void;
  isToggling: boolean;
}) {
  const isOwner = employee.role === 'OWNER';
  const roleLabel = isOwner ? 'Inhaber' : 'Techniker';

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border bg-card ${!employee.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
        {isOwner ? (
          <ShieldIcon className="h-5 w-5 text-primary" />
        ) : (
          <UserIcon className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{employee.name}</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {roleLabel}
          </span>
          {isCurrentUser && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Sie
            </span>
          )}
          {!employee.isActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              Deaktiviert
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
      </div>
      {!isOwner && !isCurrentUser && (
        <Button
          variant={employee.isActive ? 'outline' : 'default'}
          size="sm"
          onClick={() => onToggle(employee)}
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : employee.isActive ? (
            <>
              <XCircleIcon className="h-3.5 w-3.5 mr-1.5" />
              Deaktivieren
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
              Aktivieren
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function CreateEmployeeDialog({
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  onClose: () => void;
  onSubmit: (input: CreateEmployeeInput) => void;
  isPending: boolean;
  error?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, phone: phone || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Neuer Techniker</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="emp-name" className="block text-sm font-medium mb-1.5">Name *</label>
            <input
              id="emp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Max Mustermann"
            />
          </div>
          <div>
            <label htmlFor="emp-email" className="block text-sm font-medium mb-1.5">E-Mail *</label>
            <input
              id="emp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="techniker@beispiel.de"
            />
          </div>
          <div>
            <label htmlFor="emp-phone" className="block text-sm font-medium mb-1.5">Telefon</label>
            <input
              id="emp-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="+49..."
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending || !name || !email}>
              {isPending ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
              Anlegen
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
