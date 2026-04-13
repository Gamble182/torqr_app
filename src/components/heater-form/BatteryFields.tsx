'use client';

interface BatteryFieldsProps {
  hasBattery: boolean;
  batteryManufacturer: string;
  batteryModel: string;
  batteryCapacity: string;
  onHasBatteryChange: (value: boolean) => void;
  onBatteryManufacturerChange: (value: string) => void;
  onBatteryModelChange: (value: string) => void;
  onBatteryCapacityChange: (value: string) => void;
}

export function BatteryFields({
  hasBattery,
  batteryManufacturer,
  batteryModel,
  batteryCapacity,
  onHasBatteryChange,
  onBatteryManufacturerChange,
  onBatteryModelChange,
  onBatteryCapacityChange,
}: BatteryFieldsProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasBattery"
          checked={hasBattery}
          onChange={(e) => onHasBatteryChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
        />
        <label htmlFor="hasBattery" className="text-lg font-semibold text-foreground cursor-pointer">
          Batteriespeicher vorhanden
        </label>
      </div>

      {hasBattery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Battery Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hersteller
            </label>
            <input
              type="text"
              value={batteryManufacturer}
              onChange={(e) => onBatteryManufacturerChange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="z.B. Tesla"
            />
          </div>

          {/* Battery Model */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Modell
            </label>
            <input
              type="text"
              value={batteryModel}
              onChange={(e) => onBatteryModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="z.B. Powerwall 2"
            />
          </div>

          {/* Battery Capacity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Kapazität (kWh)
            </label>
            <input
              type="number"
              value={batteryCapacity}
              onChange={(e) => onBatteryCapacityChange(e.target.value)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="z.B. 13.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
