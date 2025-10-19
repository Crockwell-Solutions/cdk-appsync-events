import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Plane, AlertTriangle, Bird, Radio } from 'lucide-react';

interface ControlPanelProps {
  filters: {
    routes: boolean;
    airspace: boolean;
    birds: boolean;
    drones: boolean;
  };
  onFilterChange: (key: keyof ControlPanelProps['filters'], value: boolean) => void;
  stats: {
    routes: number;
    airspace: number;
    birds: number;
    drones: number;
  };
  isConnected: boolean;
}

const ControlPanel = ({ filters, onFilterChange, stats, isConnected }: ControlPanelProps) => {
  return (
    <Card className="absolute left-4 top-4 z-10 w-80 bg-card/95 p-4 shadow-xl backdrop-blur">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Airspace Alerter</h2>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-alert-route' : 'bg-destructive'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-alert-route" />
              <Label htmlFor="routes" className="cursor-pointer text-sm">
                Flight Routes
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{stats.routes}</span>
              <Switch
                id="routes"
                checked={filters.routes}
                onCheckedChange={(checked) => onFilterChange('routes', checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-alert-airspace" />
              <Label htmlFor="airspace" className="cursor-pointer text-sm">
                Airspace Alerts
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{stats.airspace}</span>
              <Switch
                id="airspace"
                checked={filters.airspace}
                onCheckedChange={(checked) => onFilterChange('airspace', checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bird className="h-4 w-4 text-alert-bird" />
              <Label htmlFor="birds" className="cursor-pointer text-sm">
                Bird Activity
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{stats.birds}</span>
              <Switch
                id="birds"
                checked={filters.birds}
                onCheckedChange={(checked) => onFilterChange('birds', checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-alert-drone" />
              <Label htmlFor="drones" className="cursor-pointer text-sm">
                Drone Activity
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{stats.drones}</span>
              <Switch
                id="drones"
                checked={filters.drones}
                onCheckedChange={(checked) => onFilterChange('drones', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Legend</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-alert-route" />
              <span className="text-muted-foreground">Routes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-alert-airspace" />
              <span className="text-muted-foreground">Hazards</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-alert-bird" />
              <span className="text-muted-foreground">Birds</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-alert-drone" />
              <span className="text-muted-foreground">Drones</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ControlPanel;
