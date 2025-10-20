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

    // Handle new Hazard and Alert event formats
    if (data.type === 'data' && data.event) {
      try {
        const event = JSON.parse(data.event);
        if ((event.type === 'Hazard' || event.type === 'Alert') && event.data) {
          const hazardType = event.data.type;
          const location = { lat: event.data.lat, lon: event.data.lon };
          const alertId = event.data.hazardId;

          // Handle Alert type - flash matching route and hazard
          if (event.type === 'Alert' && event.data.routeId) {
            const matchingRouteId = event.data.routeId;
            
            // Flash the route permanently
            setFlightRoutes((prev) => 
              prev.map(r => r.routeId === matchingRouteId ? { ...r, isFlashing: true } : r)
            );

            // Flash the hazard permanently based on type
            if (hazardType === 'Airspace Alert') {
              setAirspaceAlerts((prev) => 
                prev.map(a => a.id === alertId ? { ...a, isFlashing: true } : a)
              );
            } else if (hazardType === 'Bird Activity') {
              setBirdAlerts((prev) => 
                prev.map(a => a.id === alertId ? { ...a, isFlashing: true } : a)
              );
            } else if (hazardType === 'Drone Activity') {
              setDroneAlerts((prev) => 
                prev.map(a => a.id === alertId ? { ...a, isFlashing: true } : a)
              );
            } else if (hazardType === 'Thunderstorm') {
              setThunderstormAlerts((prev) => 
                prev.map(a => a.id === alertId ? { ...a, isFlashing: true } : a)
              );
            }
            
            toast.error(`Alert: Hazard impacts your route!`);
          }

          // Handle Hazard type - add new hazards
          if (hazardType === 'Airspace Alert') {
            setAirspaceAlerts((prev) => {
              if (prev.some(a => a.id === alertId)) return prev;
              const alert: AirspaceAlert = { id: alertId, center: location, radius: 50, timestamp: Date.now() };
              toast.warning('Airspace alert detected');
              return [...prev, alert];
            });
          } else if (hazardType === 'Bird Activity') {
            setBirdAlerts((prev) => {
              if (prev.some(a => a.id === alertId)) return prev;
              const alert: BirdAlert = { id: alertId, type: 'bird', location, timestamp: Date.now(), isNew: true };
              toast.info('Bird activity detected');
              setTimeout(() => {
                setBirdAlerts((p) => p.map(a => a.id === alertId ? { ...a, isNew: false } : a));
              }, 5000);
              return [...prev, alert];
            });
          } else if (hazardType === 'Drone Activity') {
            setDroneAlerts((prev) => {
              if (prev.some(a => a.id === alertId)) return prev;
              const alert: DroneAlert = { id: alertId, type: 'drone', location, timestamp: Date.now(), isNew: true };
              toast.info('Drone activity detected');
              setTimeout(() => {
                setDroneAlerts((p) => p.map(a => a.id === alertId ? { ...a, isNew: false } : a));
              }, 5000);
              return [...prev, alert];
            });
          } else if (hazardType === 'Thunderstorm') {
            setThunderstormAlerts((prev) => {
              if (prev.some(a => a.id === alertId)) return prev;
              const alert: ThunderstormAlert = { id: alertId, type: 'thunderstorm', location, timestamp: Date.now(), isNew: true };
              toast.warning('Thunderstorm detected');
              setTimeout(() => {
                setThunderstormAlerts((p) => p.map(a => a.id === alertId ? { ...a, isNew: false } : a));
              }, 5000);
              return [...prev, alert];
            });
          }
        }
      } catch (error) {
        console.error('Error parsing Hazard event:', error);
      }
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
      const response = await apiClient.post<{ routeId: string; routeDistance: number }>('/submit-route', { points: routePoints });
      const newRoute: FlightRoute = {
        id: `route-${Date.now()}`,
        routeId: response.routeId,
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
