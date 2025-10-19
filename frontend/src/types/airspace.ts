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
  isNew?: boolean;
}

export interface DroneAlert extends PointAlert {
  type: 'drone';
  isNew?: boolean;
}

export interface ThunderstormAlert extends PointAlert {
  type: 'thunderstorm';
  isNew?: boolean;
}

export type AlertData = FlightRoute | AirspaceAlert | BirdAlert | DroneAlert | ThunderstormAlert;
