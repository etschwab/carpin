// Fahrzeug / Typen / Auto Motorrad Fahrrad
export type VehicleType = "Auto" | "Fahrrad" | "Motorrad" | "Scooter";

export type Vehicle = {
  id: string;
  name: string;
  type: VehicleType;
};

// GPS / Location / Koordinate
export type Coordinate = {
  latitude: number;
  longitude: number;
};

// Map / Marker / Custom Marker
export type CustomMapMarker = Coordinate & {
  id: string;
  color: string;
  createdAt: string;
  name: string;
};

// Parkplatz / Parking Daten / GPS Foto Fahrzeug Timer
export type ParkingSpot = Coordinate & {
  id: string;
  vehicleId: string;
  savedAt: string;
  address?: string;
  description?: string;
  photoUri?: string;
};

export type ParkingHistoryItem = ParkingSpot;

// Navigation / Screen Namen / Tabs
export type Screen = "dashboard" | "timer" | "vehicles" | "history";
export type SheetMode = "compact" | "mid" | "full";
export type PhotoSource = "camera" | "library";
export type MarkerDisplayMode = "hidden" | "icons" | "labels";
