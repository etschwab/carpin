import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { SafeAreaView, useWindowDimensions, View } from "react-native";
import type { Region } from "react-native-maps";

import { Header } from "./components/Header";
import { MobileTabs } from "./components/navigation/MobileTabs";
import { WideSidebar } from "./components/navigation/WideSidebar";
import { PhotoModal } from "./components/PhotoModal";
import { FALLBACK_COORDINATE } from "./constants/appConstants";
import { useBottomSheet } from "./hooks/useBottomSheet";
import { useCurrentLocation } from "./hooks/useCurrentLocation";
import { useParkingHistory } from "./hooks/useParkingHistory";
import { useParkingSpot } from "./hooks/useParkingSpot";
import { useParkingTimer } from "./hooks/useParkingTimer";
import { usePersistedAppState } from "./hooks/usePersistedAppState";
import { useTimerNotifications } from "./hooks/useTimerNotifications";
import { useVehicleManager } from "./hooks/useVehicleManager";
import { DashboardScreen } from "./screens/DashboardScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { TimerScreen } from "./screens/TimerScreen";
import { VehiclesScreen } from "./screens/VehiclesScreen";
import { configureNotificationHandler } from "./services/notifications";
import { openRouteTo } from "./services/maps";
import { shareParkingSpot } from "./services/share";
import { styles } from "./styles/appStyles";
import type { Screen } from "./types/parking";

configureNotificationHandler();

const SCREEN_TITLES: Record<Screen, string> = {
  dashboard: "CarPin",
  history: "History",
  timer: "Parktimer",
  vehicles: "Fahrzeuge"
};

export default function App() {
  // Layout / Bildschirmgroesse / Mobile oder Breit
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isWideLayout = windowWidth > windowHeight || windowWidth >= 780;
  const [screen, setScreen] = useState<Screen>("dashboard");

  // State und Logik aus den Hooks
  const appState = usePersistedAppState();
  const { customMarkers, parkingHistory, parkingSpot, selectedVehicleId, setSelectedVehicleId, timerEnd, timerStartedAt, vehicles } = appState;
  const location = useCurrentLocation();
  const sheet = useBottomSheet();
  const vehicleManager = useVehicleManager(appState);
  const history = useParkingHistory(appState);
  const timer = useParkingTimer(appState, setScreen);
  const parking = useParkingSpot({
    appState,
    getDeviceLocation: location.getDeviceLocation,
    navigate: setScreen,
    saveSpotToHistory: history.saveSpotToHistory,
    selectedVehicle: vehicleManager.selectedVehicle,
    stopTimer: timer.stopTimer,
    updateSpotInHistory: history.updateSpotInHistory
  });

  useTimerNotifications({
    isHydrated: appState.isHydrated,
    parkingSpot,
    timerEnd,
    timerSpotId: appState.timerSpotId,
    vehicleName: vehicleManager.parkedVehicle?.name
  });

  // Map / Karte / Location / GPS Fokus
  const activeMapCoordinate = parkingSpot ?? location.currentLocation ?? FALLBACK_COORDINATE;
  const mapRegion = useMemo<Region>(
    () => ({
      latitude: activeMapCoordinate.latitude,
      longitude: activeMapCoordinate.longitude,
      latitudeDelta: parkingSpot ? 0.006 : 0.012,
      longitudeDelta: parkingSpot ? 0.006 : 0.012
    }),
    [activeMapCoordinate.latitude, activeMapCoordinate.longitude, parkingSpot]
  );
  const currentAddressLabel =
    parkingSpot?.address || location.currentLocationAddress || (location.currentLocation ? "Aktueller Standort" : "Standort wird gesucht");

  function openRoute() {
    if (parkingSpot) {
      openRouteTo(parkingSpot);
    }
  }

  function shareParking() {
    if (parkingSpot) {
      shareParkingSpot(parkingSpot, vehicleManager.selectedVehicle?.name ?? "Fahrzeug");
    }
  }

  // Navigation / Screen / Tab Auswahl
  function renderActiveScreen(isWideScreen: boolean) {
    if (screen === "dashboard") {
      return (
        <DashboardScreen
          bottomSheetAnimatedStyle={sheet.bottomSheetAnimatedStyle}
          customMarkers={customMarkers}
          currentAddressLabel={currentAddressLabel}
          currentLocation={location.currentLocation}
          isLocating={location.isLocating}
          isSavingSpot={parking.isSavingSpot}
          isWideLayout={isWideScreen}
          mapRegion={mapRegion}
          onChangeParkingDescription={parking.setParkingDescription}
          onAddCustomMarker={history.addCustomMarker}
          onDeleteCustomMarker={history.deleteCustomMarker}
          onClearParkingSpot={parking.clearParkingSpot}
          onOpenRoute={openRoute}
          onOpenTimer={() => setScreen("timer")}
          onPickPhoto={parking.pickPhoto}
          onRefreshCurrentLocation={() => location.getDeviceLocation(true)}
          onSaveParkingSpot={parking.saveParkingSpot}
          onSelectVehicle={setSelectedVehicleId}
          onShareParking={shareParking}
          onShowPhoto={() => parking.setIsPhotoVisible(true)}
          onToggleSheetMode={sheet.toggleSheetMode}
          onUpdateParkingSpotDescription={parking.updateParkingSpotDescription}
          parkingDescription={parking.parkingDescription}
          parkingSpot={parkingSpot}
          pendingPhotoUri={parking.pendingPhotoUri}
          remainingMs={timer.remainingMs}
          selectedVehicle={vehicleManager.selectedVehicle}
          selectedVehicleId={selectedVehicleId}
          sheetMode={sheet.sheetMode}
          sheetPanHandlers={sheet.sheetPanHandlers}
          timerIsActive={timer.timerIsActive}
          timerSpotMatchesActiveSpot={timer.timerSpotMatchesActiveSpot}
          vehicles={vehicles}
        />
      );
    }

    if (screen === "timer") {
      return (
        <TimerScreen
          activeTimerMinutes={timer.activeTimerMinutes}
          customTimerMinutes={timer.customTimerMinutes}
          onChangeCustomTimerMinutes={timer.setCustomTimerMinutes}
          onStartTimer={timer.startTimer}
          onStartTimerUntil={timer.startTimerUntil}
          parkingSpot={parkingSpot}
          remainingMs={timer.remainingMs}
          timerEnd={timerEnd}
          timerIsActive={timer.timerIsActive}
          timerSpotMatchesActiveSpot={timer.timerSpotMatchesActiveSpot}
          timerStartedAt={timerStartedAt}
        />
      );
    }

    if (screen === "vehicles") {
      return (
        <VehiclesScreen
          editingVehicleId={vehicleManager.editingVehicleId}
          newVehicleName={vehicleManager.newVehicleName}
          newVehicleType={vehicleManager.newVehicleType}
          onChangeNewVehicleName={vehicleManager.setNewVehicleName}
          onChangeNewVehicleType={vehicleManager.setNewVehicleType}
          onDeleteVehicle={vehicleManager.deleteVehicle}
          onResetVehicleForm={vehicleManager.resetVehicleForm}
          onSelectVehicle={setSelectedVehicleId}
          onStartEditingVehicle={vehicleManager.startEditingVehicle}
          onSubmitVehicleForm={vehicleManager.submitVehicleForm}
          selectedVehicleId={selectedVehicleId}
          vehicles={vehicles}
        />
      );
    }

    return (
      <HistoryScreen
        history={parkingHistory}
        onClearHistory={history.clearParkingHistory}
        onDeleteHistoryItem={history.deleteParkingHistoryItem}
        onOpenRoute={openRouteTo}
        vehicles={vehicles}
      />
    );
  }

  const photoModal = (
    <PhotoModal
      isVisible={parking.isPhotoVisible}
      isWideLayout={isWideLayout}
      onClose={() => parking.setIsPhotoVisible(false)}
      parkingSpot={parkingSpot}
      photoUri={parking.pendingPhotoUri}
    />
  );

  // Layout / Breit / Desktop Ansicht
  if (isWideLayout) {
    return (
      <SafeAreaView style={styles.wideSafeArea}>
        <StatusBar style="light" />
        <View style={styles.wideShell}>
          <WideSidebar
            activeScreen={screen}
            isSavingSpot={parking.isSavingSpot}
            onNavigate={setScreen}
            onOpenRoute={openRoute}
            onSaveParkingSpot={parking.saveParkingSpot}
            parkedVehicle={vehicleManager.parkedVehicle}
            parkingSpot={parkingSpot}
            selectedVehicle={vehicleManager.selectedVehicle}
          />
          <View style={styles.wideContent}>{renderActiveScreen(true)}</View>
        </View>
        {photoModal}
      </SafeAreaView>
    );
  }

  // Layout / Handy / Mobile Ansicht
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.appShell}>
        <Header title={SCREEN_TITLES[screen]} />
        <MobileTabs activeScreen={screen} onNavigate={setScreen} />
        {renderActiveScreen(false)}
      </View>
      {photoModal}
    </SafeAreaView>
  );
}
