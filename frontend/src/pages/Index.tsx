import { useState, useCallback, useEffect } from 'react';
import MapView from '@/components/MapView';
import ControlPanel from '@/components/ControlPanel';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FlightRoute, AirspaceAlert, BirdAlert, DroneAlert, ThunderstormAlert, Point } from '@/types/airspace';
import { toast } from 'sonner';
import { loadConfig } from '@/config';
import { apiClient } from '@/api/client';

const Index = () => {
  const [wsUrl, setWsUrl] = useState<string>('');
  const [wsApiKey, setWsApiKey] = useState<string>('');
  const [wsHttpDomain, setWsHttpDomain] = useState<string>('');
  const [configLoading, setConfigLoading] = useState(true);
  const [flightRoutes, setFlightRoutes] = useState<FlightRoute[]>([]);
  const [airspaceAlerts, setAirspaceAlerts] = useState<AirspaceAlert[]>([]);
  const [birdAlerts, setBirdAlerts] = useState<BirdAlert[]>([]);
  const [droneAlerts, setDroneAlerts] = useState<DroneAlert[]>([]);
  const [thunderstormAlerts, setThunderstormAlerts] = useState<ThunderstormAlert[]>([]);

  const [filters, setFilters] = useState({
    routes: true,
    airspace: true,
    birds: true,
    drones: true,
    thunderstorms: true,
  });

  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [routePoints, setRoutePoints] = useState<Point[]>([]);

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
    } else if (data.type === 'thunderstorm') {
      const alert: ThunderstormAlert = {
        id: data.id || `thunderstorm-${Date.now()}`,
        type: 'thunderstorm',
        location: data.location,
        timestamp: Date.now(),
      };
      setThunderstormAlerts((prev) => [...prev, alert]);
      toast.warning('Thunderstorm detected');
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

  const handleStartRouteCreation = () => {
    setIsCreatingRoute(true);
    setRoutePoints([]);
  };

  const handleCancelRouteCreation = () => {
    setIsCreatingRoute(false);
    setRoutePoints([]);
  };

  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (isCreatingRoute) {
      setRoutePoints((prev) => [...prev, { lat, lon }]);
    }
  }, [isCreatingRoute]);

  const handlePointDrag = useCallback((index: number, lat: number, lon: number) => {
    setRoutePoints((prev) => {
      const updated = [...prev];
      updated[index] = { lat, lon };
      return updated;
    });
  }, []);

  const handleSubmitRoute = async () => {
    if (routePoints.length < 2) {
      toast.error('Route must have at least 2 points');
      return;
    }

    try {
      await apiClient.post('/submit-route', { points: routePoints });
      const newRoute: FlightRoute = {
        id: `route-${Date.now()}`,
        points: routePoints,
        timestamp: Date.now(),
      };
      setFlightRoutes((prev) => [...prev, newRoute]);
      toast.success('Route submitted successfully');
      setIsCreatingRoute(false);
      setRoutePoints([]);
    } catch (error) {
      toast.error('Failed to submit route');
      console.error('Route submission error:', error);
    }
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
        thunderstormAlerts={thunderstormAlerts}
        filters={filters}
        isCreatingRoute={isCreatingRoute}
        routePoints={routePoints}
        onMapClick={handleMapClick}
        onPointDrag={handlePointDrag}
      />
      <ControlPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        stats={{
          routes: flightRoutes.length,
          airspace: airspaceAlerts.length,
          birds: birdAlerts.length,
          drones: droneAlerts.length,
          thunderstorms: thunderstormAlerts.length,
        }}
        isConnected={isConnected}
        isCreatingRoute={isCreatingRoute}
        routePointCount={routePoints.length}
        onStartRoute={handleStartRouteCreation}
        onCancelRoute={handleCancelRouteCreation}
        onSubmitRoute={handleSubmitRoute}
      />
    </div>
  );
};

export default Index;
