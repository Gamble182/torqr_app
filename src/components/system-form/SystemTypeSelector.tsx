import { FlameIcon, WindIcon, DropletIcon, BatteryIcon } from 'lucide-react';
import type { SystemType } from '@/hooks/useCatalog';

const SYSTEM_TYPES: Array<{
  value: SystemType;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  { value: 'HEATING', label: 'Heizung', description: 'Gas, Öl, Wärmepumpe etc.', icon: FlameIcon },
  { value: 'AC', label: 'Klimaanlage', description: 'Split-Geräte, VRF-Systeme', icon: WindIcon },
  { value: 'WATER_TREATMENT', label: 'Wasseraufbereitung', description: 'Filter, Enthärter etc.', icon: DropletIcon },
  { value: 'ENERGY_STORAGE', label: 'Energiespeicher', description: 'Pufferspeicher, Boiler', icon: BatteryIcon },
];

interface SystemTypeSelectorProps {
  value: SystemType | '';
  onChange: (type: SystemType) => void;
}

export function SystemTypeSelector({ value, onChange }: SystemTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SYSTEM_TYPES.map(({ value: type, label, description, icon: Icon }) => {
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
              selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
