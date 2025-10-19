import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FlightRoute, AirspaceAlert, BirdAlert, DroneAlert } from '@/types/airspace';
import Legend from './Legend';
import GenerateHazardsButton from './GenerateHazardsButton';

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
  const map = useRef<L.Map | null>(null);
  const layers = useRef<{ [key: string]: L.Layer }>({});

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([54.5, -2], 6);

    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | &copy; Ian Brumby <a href="https://crockwell.com" target="_blank">Crockwell Solutions</a>',
      maxZoom: 19,
    }).addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    Object.values(layers.current).forEach(layer => layer.remove());
    layers.current = {};

    if (filters.routes) {
      flightRoutes.forEach((route) => {
        const polyline = L.polyline(
          route.points.map(p => [p.lat, p.lon]),
          { color: '#34D399', weight: 3, opacity: 0.8 }
        ).addTo(map.current!);
        layers.current[`route-${route.id}`] = polyline;
      });
    }

    if (filters.airspace) {
      airspaceAlerts.forEach((alert) => {
        const circle = L.circle([alert.center.lat, alert.center.lon], {
          radius: alert.radius * 1000,
          color: '#EF4444',
          fillColor: '#EF4444',
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(map.current!);
        layers.current[`airspace-${alert.id}`] = circle;
      });
    }

    if (filters.birds) {
      birdAlerts.forEach((alert) => {
        const marker = L.circleMarker([alert.location.lat, alert.location.lon], {
          radius: 8,
          fillColor: 'hsl(var(--alert-bird))',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
          className: 'pulse',
        }).addTo(map.current!);
        layers.current[`bird-${alert.id}`] = marker;
      });
    }

    if (filters.drones) {
      droneAlerts.forEach((alert) => {
        const marker = L.circleMarker([alert.location.lat, alert.location.lon], {
          radius: 8,
          fillColor: 'hsl(var(--alert-drone))',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
          className: 'pulse',
        }).addTo(map.current!);
        layers.current[`drone-${alert.id}`] = marker;
      });
    }
  }, [flightRoutes, airspaceAlerts, birdAlerts, droneAlerts, filters]);

  return (
    <div className="relative h-screen w-full">
      <div ref={mapContainer} className="h-full w-full" />
      <Legend />
      <GenerateHazardsButton />
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
