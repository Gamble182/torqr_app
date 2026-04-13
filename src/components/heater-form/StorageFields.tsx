'use client';

interface StorageFieldsProps {
  hasStorage: boolean;
  storageManufacturer: string;
  storageModel: string;
  storageCapacity: string;
  onHasStorageChange: (value: boolean) => void;
  onStorageManufacturerChange: (value: string) => void;
  onStorageModelChange: (value: string) => void;
  onStorageCapacityChange: (value: string) => void;
}

export function StorageFields({
  hasStorage,
  storageManufacturer,
  storageModel,
  storageCapacity,
  onHasStorageChange,
  onStorageManufacturerChange,
  onStorageModelChange,
  onStorageCapacityChange,
}: StorageFieldsProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasStorage"
          checked={hasStorage}
          onChange={(e) => onHasStorageChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
        />
        <label htmlFor="hasStorage" className="text-lg font-semibold text-foreground cursor-pointer">
          Wärmespeicher vorhanden
        </label>
      </div>

      {hasStorage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Storage Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hersteller
            </label>
            <input
              type="text"
              value={storageManufacturer}
              onChange={(e) => onStorageManufacturerChange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="z.B. Viessmann"
            />
          </div>

          {/* Storage Model */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Modell
            </label>
            <input
              type="text"
              value={storageModel}
              onChange={(e) => onStorageModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="z.B. Vitocell 100-W"
            />
          </div>

          {/* Storage Capacity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Kapazität (Liter)
            </label>
            <input
              type="number"
              value={storageCapacity}
              onChange={(e) => onStorageCapacityChange(e.target.value)}
              min="0"
              step="1"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="z.B. 300"
            />
          </div>
        </div>
      )}
    </div>
  );
}
