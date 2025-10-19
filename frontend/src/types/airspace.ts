export interface Point {
  lat: number;
  lon: number;
}

export interface FlightRoute {
  id: string;
  points: Point[];
  timestamp: number;
}

export interface AirspaceAlert {
  id: string;
  center: Point;
  radius: number;
  timestamp: number;
}

export interface PointAlert {
  id: string;
  location: Point;
  timestamp: number;
}

export interface BirdAlert extends PointAlert {
  type: 'bird';
}

export interface DroneAlert extends PointAlert {
  type: 'drone';
}

export interface ThunderstormAlert extends PointAlert {
  type: 'thunderstorm';
}

export type AlertData = FlightRoute | AirspaceAlert | BirdAlert | DroneAlert | ThunderstormAlert;
