import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { VEHICLE_TYPES } from "../constants/appConstants";
import { styles } from "../styles/appStyles";
import type { Vehicle, VehicleType } from "../types/parking";

type VehiclesScreenProps = {
  editingVehicleId: string | null;
  newVehicleName: string;
  newVehicleType: VehicleType;
  onChangeNewVehicleName: (value: string) => void;
  onChangeNewVehicleType: (type: VehicleType) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  onResetVehicleForm: () => void;
  onSelectVehicle: (vehicleId: string) => void;
  onStartEditingVehicle: (vehicle: Vehicle) => void;
  onSubmitVehicleForm: () => void;
  selectedVehicleId: string;
  vehicles: Vehicle[];
};

export function VehiclesScreen({
  editingVehicleId,
  newVehicleName,
  newVehicleType,
  onChangeNewVehicleName,
  onChangeNewVehicleType,
  onDeleteVehicle,
  onResetVehicleForm,
  onSelectVehicle,
  onStartEditingVehicle,
  onSubmitVehicleForm,
  selectedVehicleId,
  vehicles
}: VehiclesScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{editingVehicleId ? "Fahrzeug bearbeiten" : "Neues Fahrzeug"}</Text>
        <TextInput
          value={newVehicleName}
          onChangeText={onChangeNewVehicleName}
          placeholder="z.B. Familienauto"
          placeholderTextColor="#777589"
          style={styles.input}
        />
        <View style={styles.typeRow}>
          {VEHICLE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, newVehicleType === type && styles.typeChipActive]}
              onPress={() => onChangeNewVehicleType(type)}
            >
              <Text style={[styles.typeChipText, newVehicleType === type && styles.typeChipTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.formActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={onSubmitVehicleForm}>
            <Text style={styles.primaryButtonText}>
              {editingVehicleId ? "Aenderungen speichern" : "Fahrzeug hinzufuegen"}
            </Text>
          </TouchableOpacity>
          {editingVehicleId && (
            <TouchableOpacity style={styles.secondaryButton} onPress={onResetVehicleForm}>
              <Text style={styles.secondaryButtonText}>Abbrechen</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Gespeicherte Fahrzeuge</Text>
        {vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleListItem}>
            <View>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleType}>{vehicle.type}</Text>
            </View>
            <View style={styles.vehicleActions}>
              <TouchableOpacity onPress={() => onSelectVehicle(vehicle.id)}>
                <Text style={styles.linkText}>{selectedVehicleId === vehicle.id ? "Aktiv" : "Auswaehlen"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onStartEditingVehicle(vehicle)}>
                <Text style={styles.linkText}>Bearbeiten</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeleteVehicle(vehicle.id)}>
                <Text style={styles.deleteText}>Loeschen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
