import { useMemo, useState } from "react";
import { Alert } from "react-native";

import { DEFAULT_VEHICLES } from "../constants/appConstants";
import type { Vehicle, VehicleType } from "../types/parking";
import type { PersistedAppState } from "./usePersistedAppState";

// Fahrzeug / Auswahl / Formular / Auto oder Fahrrad verwalten
export function useVehicleManager(appState: PersistedAppState) {
  const { parkingSpot, selectedVehicleId, setSelectedVehicleId, setVehicles, vehicles } = appState;
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>("Auto");
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0],
    [selectedVehicleId, vehicles]
  );
  const parkedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === parkingSpot?.vehicleId),
    [parkingSpot?.vehicleId, vehicles]
  );

  function resetVehicleForm() {
    setEditingVehicleId(null);
    setNewVehicleName("");
    setNewVehicleType("Auto");
  }

  function startEditingVehicle(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id);
    setNewVehicleName(vehicle.name);
    setNewVehicleType(vehicle.type);
  }

  function submitVehicleForm() {
    const trimmedName = newVehicleName.trim();
    if (!trimmedName) {
      Alert.alert("Name fehlt", "Gib einen Fahrzeugnamen ein.");
      return;
    }

    if (editingVehicleId) {
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === editingVehicleId ? { ...vehicle, name: trimmedName, type: newVehicleType } : vehicle
        )
      );
      resetVehicleForm();
      return;
    }

    const vehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      name: trimmedName,
      type: newVehicleType
    };

    setVehicles((currentVehicles) => [...currentVehicles, vehicle]);
    setSelectedVehicleId(vehicle.id);
    resetVehicleForm();
  }

  // Fahrzeug / Loeschen / Schutz bei aktivem Parkplatz
  function deleteVehicle(vehicleId: string) {
    const vehicle = vehicles.find((currentVehicle) => currentVehicle.id === vehicleId);
    if (!vehicle) {
      return;
    }

    if (parkingSpot?.vehicleId === vehicleId) {
      Alert.alert(
        "Fahrzeug wird verwendet",
        "Dieses Fahrzeug hat gerade einen gespeicherten Parkplatz. Beende zuerst das Parking."
      );
      return;
    }

    if (vehicles.length === 1) {
      Alert.alert("Nicht möglich", "Mindestens ein Fahrzeug muss gespeichert bleiben.");
      return;
    }

    Alert.alert("Fahrzeug löschen", `${vehicle.name} wirklich entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: () => {
          const remainingVehicles = vehicles.filter((currentVehicle) => currentVehicle.id !== vehicleId);
          setVehicles(remainingVehicles);

          if (editingVehicleId === vehicleId) {
            resetVehicleForm();
          }

          if (selectedVehicleId === vehicleId) {
            setSelectedVehicleId(remainingVehicles[0]?.id ?? DEFAULT_VEHICLES[0].id);
          }
        }
      }
    ]);
  }

  return {
    deleteVehicle,
    editingVehicleId,
    newVehicleName,
    newVehicleType,
    parkedVehicle,
    resetVehicleForm,
    selectedVehicle,
    setNewVehicleName,
    setNewVehicleType,
    startEditingVehicle,
    submitVehicleForm
  };
}
