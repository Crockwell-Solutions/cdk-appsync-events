import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FlightRoute, AirspaceAlert, BirdAlert, DroneAlert, Point } from '@/types/airspace';

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
  isCreatingRoute: boolean;
  routePoints: Point[];
  onMapClick: (lat: number, lon: number) => void;
  onPointDrag: (index: number, lat: number, lon: number) => void;
}

const MapView = ({ flightRoutes, airspaceAlerts, birdAlerts, droneAlerts, filters, isCreatingRoute, routePoints, onMapClick, onPointDrag }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<{ [key: string]: L.Layer }>({});
  const routeMarkers = useRef<L.Marker[]>([]);
  const routeLine = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([54.5, -2], 6);

    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | &copy; Ian Brumby <a href="https://crockwell.com" target="_blank">Crockwell Solutions</a>',
      maxZoom: 19,
    }).addTo(map.current);

    map.current.on('click', (e: L.LeafletMouseEvent) => {
      if (isCreatingRoute) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isCreatingRoute, onMapClick]);

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

  useEffect(() => {
    if (!map.current) return;

    routeMarkers.current.forEach(marker => marker.remove());
    routeMarkers.current = [];
    routeLine.current?.remove();
    routeLine.current = null;

    if (isCreatingRoute && routePoints.length > 0) {
      routePoints.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lon], {
          draggable: true,
          icon: L.divIcon({
            className: 'route-marker',
            html: `<div style="background: #3B82F6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
            iconSize: [24, 24],
          }),
        }).addTo(map.current!);

        marker.on('drag', (e: L.DragEndEvent) => {
          const pos = (e.target as L.Marker).getLatLng();
          onPointDrag(index, pos.lat, pos.lng);
        });

        routeMarkers.current.push(marker);
      });

      if (routePoints.length > 1) {
        routeLine.current = L.polyline(
          routePoints.map(p => [p.lat, p.lon]),
          { color: '#3B82F6', weight: 3, opacity: 0.8, dashArray: '10, 5' }
        ).addTo(map.current!);
      }
    }
  }, [isCreatingRoute, routePoints, onPointDrag]);

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
