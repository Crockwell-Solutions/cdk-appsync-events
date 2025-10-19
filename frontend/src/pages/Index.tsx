import { useState, useCallback, useEffect } from 'react';
import MapView from '@/components/MapView';
import ControlPanel from '@/components/ControlPanel';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FlightRoute, AirspaceAlert, BirdAlert, DroneAlert } from '@/types/airspace';
import { toast } from 'sonner';
import { loadConfig } from '@/config';

const Index = () => {
  const [wsUrl, setWsUrl] = useState<string>('');
  const [wsApiKey, setWsApiKey] = useState<string>('');
  const [wsHttpDomain, setWsHttpDomain] = useState<string>('');
  const [configLoading, setConfigLoading] = useState(true);
  const [flightRoutes, setFlightRoutes] = useState<FlightRoute[]>([]);
  const [airspaceAlerts, setAirspaceAlerts] = useState<AirspaceAlert[]>([]);
  const [birdAlerts, setBirdAlerts] = useState<BirdAlert[]>([]);
  const [droneAlerts, setDroneAlerts] = useState<DroneAlert[]>([]);

  const [filters, setFilters] = useState({
    routes: true,
    airspace: true,
    birds: true,
    drones: true,
  });

  useEffect(() => {
    loadConfig().then((config) => {
      if (config) {
        setWsUrl(config.eventsUrl);
        setWsApiKey(config.eventsApiKey);
        setWsHttpDomain(config.eventsHttpDomain);
      }
      setConfigLoading(false);
    });
  }, []);

  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('Received WebSocket message:', data);

    // Parse incoming data based on type
    if (data.type === 'flight_route') {
      const route: FlightRoute = {
        id: data.id || `route-${Date.now()}`,
        points: data.points,
        timestamp: Date.now(),
      };
      setFlightRoutes((prev) => [...prev, route]);
      toast.info('New flight route detected');
    } else if (data.type === 'airspace_alert') {
      const alert: AirspaceAlert = {
        id: data.id || `airspace-${Date.now()}`,
        center: data.center,
        radius: data.radius || 50,
        timestamp: Date.now(),
      };
      setAirspaceAlerts((prev) => [...prev, alert]);
      toast.warning('Airspace alert detected');
    } else if (data.type === 'bird') {
      const alert: BirdAlert = {
        id: data.id || `bird-${Date.now()}`,
        type: 'bird',
        location: data.location,
        timestamp: Date.now(),
      };
      setBirdAlerts((prev) => [...prev, alert]);
      toast.info('Bird activity detected');
    } else if (data.type === 'drone') {
      const alert: DroneAlert = {
        id: data.id || `drone-${Date.now()}`,
        type: 'drone',
        location: data.location,
        timestamp: Date.now(),
      };
      setDroneAlerts((prev) => [...prev, alert]);
      toast.info('Drone activity detected');
    }
  }, []);

  const { isConnected } = useWebSocket({
    url: wsUrl || '',
    apiKey: wsApiKey || '',
    httpDomain: wsHttpDomain || '',
    onMessage: handleWebSocketMessage,
    enabled: !!wsUrl && !!wsApiKey && !!wsHttpDomain,
  });

  const handleFilterChange = (key: keyof typeof filters, value: boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (configLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  if (!wsUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-destructive">Configuration not found. Please deploy the backend first.</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <MapView
        flightRoutes={flightRoutes}
        airspaceAlerts={airspaceAlerts}
        birdAlerts={birdAlerts}
        droneAlerts={droneAlerts}
        filters={filters}
      />
      <ControlPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        stats={{
          routes: flightRoutes.length,
          airspace: airspaceAlerts.length,
          birds: birdAlerts.length,
          drones: droneAlerts.length,
        }}
        isConnected={isConnected}
      />
    </div>
  );
};

export default Index;
