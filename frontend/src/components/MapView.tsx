import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FlightRoute, AirspaceAlert, BirdAlert, DroneAlert, ThunderstormAlert, Point } from '@/types/airspace';

interface MapViewProps {
  flightRoutes: FlightRoute[];
  airspaceAlerts: AirspaceAlert[];
  birdAlerts: BirdAlert[];
  droneAlerts: DroneAlert[];
  thunderstormAlerts: ThunderstormAlert[];
  filters: {
    routes: boolean;
    airspace: boolean;
    birds: boolean;
    drones: boolean;
    thunderstorms: boolean;
  };
  isCreatingRoute: boolean;
  routePoints: Point[];
  onMapClick: (lat: number, lon: number) => void;
  onPointDrag: (index: number, lat: number, lon: number) => void;
}

const MapView = ({ flightRoutes, airspaceAlerts, birdAlerts, droneAlerts, thunderstormAlerts, filters, isCreatingRoute, routePoints, onMapClick, onPointDrag }: MapViewProps) => {
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

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isCreatingRoute) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };

    map.current.on('click', handleClick);

    return () => {
      map.current?.off('click', handleClick);
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
          { color: route.isFlashing ? '#EF4444' : '#34D399', weight: 3, opacity: 0.8, className: route.isFlashing ? 'flash-red' : '' }
        ).addTo(map.current!);
        layers.current[`route-${route.id}`] = polyline;

        if (route.points.length > 0) {
          const startPoint = route.points[0];
          const endPoint = route.points[route.points.length - 1];
          
          const bgColor = route.isFlashing ? '#EF4444' : '#34D399';
          const planeIcon = L.divIcon({
            className: 'plane-marker',
            html: `<div style="background: ${bgColor}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg></div>`,
            iconSize: [24, 24],
          });

          const startMarker = L.marker([startPoint.lat, startPoint.lon], { icon: planeIcon }).addTo(map.current!);
          const endMarker = L.marker([endPoint.lat, endPoint.lon], { icon: planeIcon }).addTo(map.current!);
          
          layers.current[`route-start-${route.id}`] = startMarker;
          layers.current[`route-end-${route.id}`] = endMarker;
        }
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
          className: alert.isFlashing ? 'flash-red' : '',
        }).addTo(map.current!);
        layers.current[`airspace-${alert.id}`] = circle;
      });
    }

    if (filters.birds) {
      birdAlerts.forEach((alert) => {
        const animationClass = alert.isFlashing ? 'flash-red' : (alert.isNew ? 'flash-in' : 'pulse');
        const bgColor = alert.isFlashing ? '#EF4444' : 'hsl(45, 93%, 47%)';
        const icon = L.divIcon({
          className: 'hazard-marker',
          html: `<div class="${animationClass}" style="background: ${bgColor}; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([alert.location.lat, alert.location.lon], { icon }).addTo(map.current!);
        layers.current[`bird-${alert.id}`] = marker;
      });
    }

    if (filters.drones) {
      droneAlerts.forEach((alert) => {
        const animationClass = alert.isFlashing ? 'flash-red' : (alert.isNew ? 'flash-in' : 'pulse');
        const bgColor = alert.isFlashing ? '#EF4444' : 'hsl(271, 91%, 65%)';
        const icon = L.divIcon({
          className: 'hazard-marker',
          html: `<div class="${animationClass}" style="background: ${bgColor}; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.04 4.05A10 10 0 1 1 19.96 19.95A10 10 0 0 1 4.04 4.05z"/><path d="M13.34 8.5l-5 2.5 5 2.5 2.5 5 2.5-5 5-2.5-5-2.5-2.5-5z"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([alert.location.lat, alert.location.lon], { icon }).addTo(map.current!);
        layers.current[`drone-${alert.id}`] = marker;
      });
    }

    if (filters.thunderstorms) {
      thunderstormAlerts.forEach((alert) => {
        const animationClass = alert.isFlashing ? 'flash-red' : (alert.isNew ? 'flash-in' : 'pulse');
        const bgColor = alert.isFlashing ? '#EF4444' : 'hsl(280, 100%, 70%)';
        const icon = L.divIcon({
          className: 'hazard-marker',
          html: `<div class="${animationClass}" style="background: ${bgColor}; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([alert.location.lat, alert.location.lon], { icon }).addTo(map.current!);
        layers.current[`thunderstorm-${alert.id}`] = marker;
      });
    }
  }, [flightRoutes, airspaceAlerts, birdAlerts, droneAlerts, thunderstormAlerts, filters]);

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
        .hazard-marker {
          background: transparent !important;
          border: none !important;
        }
        .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .flash-in {
          animation: flash-in 5s ease-in-out forwards;
        }
        @keyframes flash-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          10% {
            transform: scale(1.5);
            opacity: 1;
          }
          20% {
            transform: scale(0.8);
          }
          30% {
            transform: scale(1.3);
          }
          40% {
            transform: scale(0.9);
          }
          50% {
            transform: scale(1.2);
          }
          60% {
            transform: scale(0.95);
          }
          70% {
            transform: scale(1.1);
          }
          80% {
            transform: scale(0.98);
          }
          90% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .flash-red {
          animation: flash-red 2s ease-in-out infinite;
        }
        @keyframes flash-red {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(2) hue-rotate(-30deg);
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;
