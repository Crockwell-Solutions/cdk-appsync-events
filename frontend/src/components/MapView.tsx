import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FlightRoute, AirspaceAlert, BirdAlert, DroneAlert } from '@/types/airspace';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface MapViewProps {
  flightRoutes: FlightRoute[];
  airspaceAlerts: AirspaceAlert[];
  birdAlerts: BirdAlert[];
  droneAlerts: DroneAlert[];
  filters: {
    routes: boolean;
    airspace: boolean;
    birds: boolean;
    drones: boolean;
  };
}

const MapView = ({ flightRoutes, airspaceAlerts, birdAlerts, droneAlerts, filters }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSubmitted, setTokenSubmitted] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !tokenSubmitted || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-95, 37],
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [tokenSubmitted, mapboxToken]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Clear existing markers and layers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add flight routes
    if (filters.routes) {
      flightRoutes.forEach((route, index) => {
        const sourceId = `route-${route.id}`;
        
        if (map.current!.getSource(sourceId)) {
          map.current!.removeLayer(`route-line-${route.id}`);
          map.current!.removeSource(sourceId);
        }

        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.points.map(p => [p.lon, p.lat]),
            },
          },
        });

        map.current!.addLayer({
          id: `route-line-${route.id}`,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#34D399',
            'line-width': 3,
            'line-opacity': 0.8,
          },
        });
      });
    }

    // Add airspace alerts
    if (filters.airspace) {
      airspaceAlerts.forEach((alert) => {
        const sourceId = `airspace-${alert.id}`;
        
        if (map.current!.getSource(sourceId)) {
          map.current!.removeLayer(`airspace-circle-${alert.id}`);
          map.current!.removeSource(sourceId);
        }

        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [alert.center.lon, alert.center.lat],
            },
          },
        });

        map.current!.addLayer({
          id: `airspace-circle-${alert.id}`,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': alert.radius * 100,
            'circle-color': '#EF4444',
            'circle-opacity': 0.3,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#EF4444',
          },
        });
      });
    }

    // Add bird alerts
    if (filters.birds) {
      birdAlerts.forEach((alert) => {
        const el = document.createElement('div');
        el.className = 'w-4 h-4 rounded-full bg-alert-bird border-2 border-background pulse';
        
        new mapboxgl.Marker(el)
          .setLngLat([alert.location.lon, alert.location.lat])
          .addTo(map.current!);
      });
    }

    // Add drone alerts
    if (filters.drones) {
      droneAlerts.forEach((alert) => {
        const el = document.createElement('div');
        el.className = 'w-4 h-4 rounded-full bg-alert-drone border-2 border-background pulse';
        
        new mapboxgl.Marker(el)
          .setLngLat([alert.location.lon, alert.location.lat])
          .addTo(map.current!);
      });
    }
  }, [flightRoutes, airspaceAlerts, birdAlerts, droneAlerts, filters]);

  if (!tokenSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">Enter Mapbox Token</h2>
            <p className="text-sm text-muted-foreground">
              Get your token from{' '}
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="text"
              placeholder="pk.ey..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="bg-card"
            />
          </div>
          <button
            onClick={() => setTokenSubmitted(true)}
            disabled={!mapboxToken}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      <div ref={mapContainer} className="h-full w-full" />
      <style>{`
        .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;
