'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XIcon, Loader2Icon } from 'lucide-react';

interface AddNewEntryModalProps {
  isOpen: boolean;
  type: 'category' | 'manufacturer' | 'model';
  value: string;
  loading: boolean;
  category?: string;
  manufacturer?: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function AddNewEntryModal({
  isOpen,
  type,
  value,
  loading,
  category,
  manufacturer,
  onValueChange,
  onSubmit,
  onClose,
}: AddNewEntryModalProps) {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'category':
        return 'Neue Kategorie hinzufügen';
      case 'manufacturer':
        return 'Neuen Hersteller hinzufügen';
      case 'model':
        return 'Neues Modell hinzufügen';
      default:
        return '';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'category':
        return 'z.B. Gasheizung';
      case 'manufacturer':
        return 'z.B. Viessmann';
      case 'model':
        return 'z.B. Vitodens 200-W';
      default:
        return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{getTitle()}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {type === 'manufacturer' && category && (
          <p className="text-sm text-muted-foreground mb-4">
            Kategorie: <span className="font-medium">{category}</span>
          </p>
        )}

        {type === 'model' && category && manufacturer && (
          <div className="text-sm text-muted-foreground mb-4 space-y-1">
            <p>Kategorie: <span className="font-medium">{category}</span></p>
            <p>Hersteller: <span className="font-medium">{manufacturer}</span></p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {type === 'category' && 'Kategoriename'}
              {type === 'manufacturer' && 'Herstellername'}
              {type === 'model' && 'Modellname'}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || !value.trim()}
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Wird hinzugefügt...
                </>
              ) : (
                'Hinzufügen'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
