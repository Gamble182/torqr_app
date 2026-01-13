'use client';

import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

interface Model {
  manufacturer: string;
  models: string[];
}

interface Category {
  category: string;
  manufacturers: Model[];
}

interface HeatingSystemSelectorProps {
  categories: Category[];
  category: string;
  manufacturer: string;
  model: string;
  availableManufacturers: Model[];
  availableModels: string[];
  onCategoryChange: (value: string) => void;
  onManufacturerChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onAddCategory: () => void;
  onAddManufacturer: () => void;
  onAddModel: () => void;
}

export function HeatingSystemSelector({
  categories,
  category,
  manufacturer,
  model,
  availableManufacturers,
  availableModels,
  onCategoryChange,
  onManufacturerChange,
  onModelChange,
  onAddCategory,
  onAddManufacturer,
  onAddModel,
}: HeatingSystemSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Kategorie
        </label>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Bitte wählen...</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddCategory}
            title="Neue Kategorie hinzufügen"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Manufacturer */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Hersteller
        </label>
        <div className="flex gap-2">
          <select
            value={manufacturer}
            onChange={(e) => onManufacturerChange(e.target.value)}
            disabled={!category}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="">Bitte wählen...</option>
            {availableManufacturers.map((mfr) => (
              <option key={mfr.manufacturer} value={mfr.manufacturer}>
                {mfr.manufacturer}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddManufacturer}
            disabled={!category}
            title="Neuen Hersteller hinzufügen"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Modell <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={!manufacturer}
            required
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="">Bitte wählen...</option>
            {availableModels.map((mdl) => (
              <option key={mdl} value={mdl}>
                {mdl}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddModel}
            disabled={!manufacturer}
            title="Neues Modell hinzufügen"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
