export type VehicleType = "Auto" | "Fahrrad" | "Motorrad" | "Scooter";

export type Vehicle = {
  id: string;
  name: string;
  type: VehicleType;
};

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type CustomMapMarker = Coordinate & {
  id: string;
  color: string;
  createdAt: string;
  name: string;
};

export type ParkingSpot = Coordinate & {
  id: string;
  vehicleId: string;
  savedAt: string;
  address?: string;
  description?: string;
  photoUri?: string;
};

export type ParkingHistoryItem = ParkingSpot;

export type Screen = "dashboard" | "timer" | "vehicles" | "history";
export type SheetMode = "compact" | "mid" | "full";
export type PhotoSource = "camera" | "library";
export type MarkerDisplayMode = "hidden" | "icons" | "labels";
