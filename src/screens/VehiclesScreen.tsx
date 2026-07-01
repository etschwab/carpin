import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { VEHICLE_TYPES } from "../constants/appConstants";
import { styles } from "../styles/appStyles";
import type { Vehicle, VehicleType } from "../types/parking";

type VehiclesScreenProps = {
  newVehicleName: string;
  newVehicleType: VehicleType;
  onAddVehicle: () => void;
  onChangeNewVehicleName: (value: string) => void;
  onChangeNewVehicleType: (type: VehicleType) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  onSelectVehicle: (vehicleId: string) => void;
  selectedVehicleId: string;
  vehicles: Vehicle[];
};

export function VehiclesScreen({
  newVehicleName,
  newVehicleType,
  onAddVehicle,
  onChangeNewVehicleName,
  onChangeNewVehicleType,
  onDeleteVehicle,
  onSelectVehicle,
  selectedVehicleId,
  vehicles
}: VehiclesScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Neues Fahrzeug</Text>
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
        <TouchableOpacity style={styles.primaryButton} onPress={onAddVehicle}>
          <Text style={styles.primaryButtonText}>Fahrzeug hinzufügen</Text>
        </TouchableOpacity>
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
                <Text style={styles.linkText}>{selectedVehicleId === vehicle.id ? "Aktiv" : "Auswählen"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeleteVehicle(vehicle.id)}>
                <Text style={styles.deleteText}>Löschen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
