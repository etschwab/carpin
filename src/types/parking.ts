// Fahrzeug Typen
export type VehicleType = "Auto" | "Fahrrad" | "Motorrad" | "Scooter";

export type Vehicle = {
  id: string;
  name: string;
  type: VehicleType;
};

// GPS Punkt
export type Coordinate = {
  latitude: number;
  longitude: number;
};

// Karten Marker
export type CustomMapMarker = Coordinate & {
  id: string;
  color: string;
  createdAt: string;
  name: string;
};

// Parking Daten
export type ParkingSpot = Coordinate & {
  id: string;
  vehicleId: string;
  savedAt: string;
  address?: string;
  description?: string;
  photoUri?: string;
};

export type ParkingHistoryItem = ParkingSpot;

// Screen Namen
export type Screen = "dashboard" | "timer" | "vehicles" | "history";
export type SheetMode = "compact" | "mid" | "full";
export type PhotoSource = "camera" | "library";
export type MarkerDisplayMode = "hidden" | "icons" | "labels";
