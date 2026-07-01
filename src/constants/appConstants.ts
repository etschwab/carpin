import { Dimensions } from "react-native";

import type { Coordinate, SheetMode, Vehicle, VehicleType } from "../types/parking";

export const STORAGE_KEYS = {
  vehicles: "carpin:vehicles",
  parkingSpot: "carpin:parkingSpot",
  parkingHistory: "carpin:parkingHistory",
  timerEnd: "carpin:timerEnd",
  timerStartedAt: "carpin:timerStartedAt",
  timerSpotId: "carpin:timerSpotId"
};

export const MAX_PARKING_HISTORY_ITEMS = 30;

export const VEHICLE_TYPES: VehicleType[] = ["Auto", "Fahrrad", "Motorrad", "Scooter"];

export const DEFAULT_VEHICLES: Vehicle[] = [
  { id: "vehicle-auto", name: "VW Golf", type: "Auto" },
  { id: "vehicle-bike", name: "Tims Fahrrad", type: "Fahrrad" }
];

export const FALLBACK_COORDINATE: Coordinate = {
  latitude: 47.3769,
  longitude: 8.5417
};

export const SHEET_HEIGHTS: Record<SheetMode, number> = {
  compact: 112,
  mid: 306,
  full: Math.round(Dimensions.get("window").height * 0.86)
};

export const MAP_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#151523" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b7b5c8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d0d19" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#25253a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#11111d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#073f59" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#143b32" }] }
];
