import { useState } from 'react';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Plane, AlertTriangle, Bird, Radio, ChevronDown, ChevronUp, Route, X, Check, Zap, CloudLightning } from 'lucide-react';
import { getConfig } from '@/config';
import { toast } from 'sonner';

interface ControlPanelProps {
  filters: {
    routes: boolean;
    airspace: boolean;
    birds: boolean;
    drones: boolean;
    thunderstorms: boolean;
  };
  onFilterChange: (key: keyof ControlPanelProps['filters'], value: boolean) => void;
  stats: {
    routes: number;
    airspace: number;
    birds: number;
    drones: number;
    thunderstorms: number;
  };
  isConnected: boolean;
  isCreatingRoute: boolean;
  routePointCount: number;
  onStartRoute: () => void;
  onCancelRoute: () => void;
  onSubmitRoute: () => void;
}

const ControlPanel = ({ filters, onFilterChange, stats, isConnected, isCreatingRoute, routePointCount, onStartRoute, onCancelRoute, onSubmitRoute }: ControlPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingHazards, setLoadingHazards] = useState(false);

  const handleGenerateHazards = async () => {
    const config = getConfig();
    if (!config) {
      toast.error('Configuration not loaded');
      return;
    }

    setLoadingHazards(true);
    try {
      const response = await fetch(`${config.restApiUrl}generate-hazards`, {
        method: 'POST',
        headers: {
          'x-api-key': config.restApiKey,
        },
      });

      if (response.ok) {
        toast.success('Hazards generated successfully');
      } else {
        toast.error('Failed to generate hazards');
      }
    } catch (error) {
      toast.error('Error generating hazards');
      console.error(error);
    } finally {
      setLoadingHazards(false);
    }
  };

  return (
    <Card className="absolute bottom-6 left-6 z-[1000] w-80 bg-white/95 shadow-lg border border-gray-300 transition-all duration-300">
      <div className="p-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h2 className="text-lg font-bold text-gray-800">Airspace Alerter</h2>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronUp className="h-4 w-4 text-gray-600" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <Separator />
          <div className="space-y-3">
          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onFilterChange('routes', !filters.routes)}
          >
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5" style={{ color: '#34D399' }} />
              <div>
                <div className="text-sm font-medium text-gray-800">Flight Routes</div>
                <div className="text-xs text-gray-500">{stats.routes} active</div>
              </div>
            </div>
            <div className={`h-3 w-3 rounded-full transition-colors ${filters.routes ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>

          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onFilterChange('airspace', !filters.airspace)}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" style={{ color: '#EF4444' }} />
              <div>
                <div className="text-sm font-medium text-gray-800">Airspace Alerts</div>
                <div className="text-xs text-gray-500">{stats.airspace} active</div>
              </div>
            </div>
            <div className={`h-3 w-3 rounded-full transition-colors ${filters.airspace ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>

          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onFilterChange('birds', !filters.birds)}
          >
            <div className="flex items-center gap-3">
              <Bird className="h-5 w-5" style={{ color: 'hsl(45, 93%, 47%)' }} />
              <div>
                <div className="text-sm font-medium text-gray-800">Bird Activity</div>
                <div className="text-xs text-gray-500">{stats.birds} active</div>
              </div>
            </div>
            <div className={`h-3 w-3 rounded-full transition-colors ${filters.birds ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>

          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onFilterChange('drones', !filters.drones)}
          >
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5" style={{ color: 'hsl(271, 91%, 65%)' }} />
              <div>
                <div className="text-sm font-medium text-gray-800">Drone Activity</div>
                <div className="text-xs text-gray-500">{stats.drones} active</div>
              </div>
            </div>
            <div className={`h-3 w-3 rounded-full transition-colors ${filters.drones ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>

          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onFilterChange('thunderstorms', !filters.thunderstorms)}
          >
            <div className="flex items-center gap-3">
              <CloudLightning className="h-5 w-5" style={{ color: 'hsl(280, 100%, 70%)' }} />
              <div>
                <div className="text-sm font-medium text-gray-800">Thunderstorms</div>
                <div className="text-xs text-gray-500">{stats.thunderstorms} active</div>
              </div>
            </div>
            <div className={`h-3 w-3 rounded-full transition-colors ${filters.thunderstorms ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>
          </div>

          <Separator />

          {!isCreatingRoute ? (
            <div className="space-y-2">
              <Button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStartRoute(); }}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Route className="h-4 w-4" />
                Create Route
              </Button>
              <Button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGenerateHazards(); }}
                disabled={loadingHazards}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                <Zap className="h-4 w-4" />
                {loadingHazards ? 'Generating...' : 'Generate Hazards'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-700" />
                <span className="text-sm font-bold text-blue-900">Creating Route</span>
              </div>
              <p className="text-sm text-blue-800">
                Click on the map to add points ({routePointCount} added)
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSubmitRoute(); }}
                  disabled={routePointCount < 2}
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  size="sm"
                >
                  <Check className="h-4 w-4" />
                  Submit
                </Button>
                <Button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancelRoute(); }}
                  variant="outline"
                  className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ControlPanel;
