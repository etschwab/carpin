import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#080911"
  },
  appShell: {
    flex: 1,
    backgroundColor: "#0d0d19",
    paddingHorizontal: 16,
    paddingTop: 8
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  logo: {
    borderRadius: 14,
    height: 34,
    width: 34
  },
  headerTitle: {
    color: "#f7f8ff",
    fontSize: 18,
    fontWeight: "900"
  },
  tabs: {
    backgroundColor: "#151523",
    borderColor: "#242439",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    padding: 5
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 13,
    flex: 1,
    paddingVertical: 10
  },
  tabButtonActive: {
    backgroundColor: "#20c8f4"
  },
  tabText: {
    color: "#9c9aac",
    fontSize: 13,
    fontWeight: "800"
  },
  tabTextActive: {
    color: "#071018"
  },
  mapScreen: {
    flex: 1,
    marginHorizontal: -16
  },
  mapCard: {
    flex: 1,
    minHeight: 520,
    overflow: "hidden",
    position: "relative"
  },
  realMap: {
    ...StyleSheet.absoluteFillObject
  },
  mapOverlayLabel: {
    backgroundColor: "rgba(17, 17, 29, 0.92)",
    borderColor: "#242439",
    borderRadius: 18,
    borderWidth: 1,
    left: 16,
    maxWidth: 245,
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: "absolute",
    top: 14
  },
  mapOverlayEyebrow: {
    color: "#20c8f4",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  mapOverlayText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3
  },
  locationButton: {
    alignItems: "center",
    backgroundColor: "rgba(17, 17, 29, 0.92)",
    borderColor: "#242439",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "absolute",
    right: 16,
    top: 18
  },
  locationButtonText: {
    color: "#20c8f4",
    fontSize: 12,
    fontWeight: "900"
  },
  userMarker: {
    alignItems: "center",
    backgroundColor: "rgba(32, 200, 244, 0.22)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  userMarkerInner: {
    backgroundColor: "#20c8f4",
    borderColor: "#ffffff",
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14
  },
  parkingMarker: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#20c8f4",
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  parkingMarkerText: {
    color: "#071018",
    fontSize: 15,
    fontWeight: "900"
  },
  bottomSheet: {
    backgroundColor: "#11111d",
    borderColor: "#222238",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    padding: 16,
    paddingBottom: 20,
    position: "absolute",
    right: 0
  },
  sheetHandleArea: {
    marginBottom: 8
  },
  handleTapTarget: {
    alignItems: "center",
    paddingBottom: 2,
    paddingTop: 2
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#414154",
    borderRadius: 2,
    height: 4,
    marginBottom: 5,
    width: 38
  },
  sheetHint: {
    color: "#777589",
    fontSize: 11,
    fontWeight: "800"
  },
  fullSheetContent: {
    paddingBottom: 220
  },
  sheetContentStage: {
    flex: 1,
    position: "relative"
  },
  sheetContentLayer: {
    ...StyleSheet.absoluteFillObject
  },
  fullHeaderCard: {
    alignItems: "center",
    backgroundColor: "#0e3448",
    borderColor: "#176783",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 16
  },
  fullHeaderIcon: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  fullHeaderIconText: {
    color: "#071018",
    fontSize: 22,
    fontWeight: "900"
  },
  fullHeaderText: {
    flex: 1
  },
  fullAddressTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
    marginTop: 8
  },
  fullIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  fullInfoTile: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 112,
    padding: 13,
    width: "48%"
  },
  fullInfoIcon: {
    alignItems: "center",
    backgroundColor: "#073f59",
    borderRadius: 12,
    height: 32,
    justifyContent: "center",
    marginBottom: 10,
    width: 32
  },
  fullInfoIconText: {
    color: "#20c8f4",
    fontSize: 15,
    fontWeight: "900"
  },
  fullInfoLabel: {
    color: "#777589",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  fullInfoValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
    marginTop: 5
  },
  fullActionPanel: {
    marginTop: 4
  },
  lastSavedCard: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  lastSavedContent: {
    flex: 1
  },
  pinBadge: {
    alignItems: "center",
    backgroundColor: "#073f59",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  pinBadgeText: {
    color: "#20c8f4",
    fontSize: 18,
    fontWeight: "900"
  },
  lastSavedLabel: {
    color: "#777589",
    fontSize: 12,
    fontWeight: "800"
  },
  lastSavedText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4
  },
  vehicleStrip: {
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10
  },
  vehicleSelectorScroll: {
    flexGrow: 0,
    height: 96,
    maxHeight: 96
  },
  vehiclePill: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  vehiclePillActive: {
    backgroundColor: "#20c8f4"
  },
  vehicleIconPill: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "column",
    height: 86,
    justifyContent: "center",
    marginHorizontal: 4,
    minWidth: 82,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  vehicleIcon: {
    marginTop: 5
  },
  vehiclePillText: {
    color: "#b7b5c8",
    fontSize: 12,
    fontWeight: "900"
  },
  vehiclePillTextActive: {
    color: "#071018"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 16,
    marginTop: 14,
    paddingVertical: 16
  },
  midSaveButton: {
    marginTop: 20
  },
  compactSheetButton: {
    marginTop: 0,
    paddingVertical: 13
  },
  formActions: {
    gap: 10,
    marginTop: 14
  },
  primaryButtonSmall: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 14,
    flex: 1.25,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#071018",
    fontSize: 14,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16
  },
  secondaryButtonText: {
    color: "#b7b5c8",
    fontSize: 14,
    fontWeight: "900"
  },
  savedCard: {
    backgroundColor: "#0e3448",
    borderColor: "#176783",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14
  },
  savedEyebrow: {
    color: "#20c8f4",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  savedTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8
  },
  savedMeta: {
    color: "#9aa8b6",
    fontSize: 13,
    marginTop: 5
  },
  parkingDescriptionText: {
    color: "#d8e7f1",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  metric: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 12
  },
  metricLabel: {
    color: "#777589",
    fontSize: 10,
    fontWeight: "800"
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "center"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  darkButton: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    flex: 0.85,
    paddingVertical: 14
  },
  darkButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },
  timerShortcut: {
    alignItems: "center",
    backgroundColor: "#0e3448",
    borderColor: "#176783",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 13
  },
  timerShortcutText: {
    color: "#20c8f4",
    fontSize: 13,
    fontWeight: "900"
  },
  ghostButton: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8
  },
  ghostButtonText: {
    color: "#777589",
    fontSize: 12,
    fontWeight: "800"
  },
  endParkingButton: {
    alignItems: "center",
    backgroundColor: "#2b1b23",
    borderColor: "#6f2b3c",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 15
  },
  endParkingButtonText: {
    color: "#ff8a9a",
    fontSize: 14,
    fontWeight: "900"
  },
  content: {
    paddingBottom: 28
  },
  timerRing: {
    alignItems: "center",
    alignSelf: "center",
    borderColor: "#1d1d2b",
    borderRadius: 82,
    borderWidth: 8,
    height: 164,
    justifyContent: "center",
    marginTop: 26,
    width: 164
  },
  timerArc: {
    borderColor: "#20c8f4",
    borderRadius: 82,
    borderRightWidth: 8,
    borderTopWidth: 8,
    height: 164,
    position: "absolute",
    transform: [{ rotate: "20deg" }],
    width: 164
  },
  timerLabel: {
    color: "#777589",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  timerValue: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 2
  },
  timerUnit: {
    color: "#20c8f4",
    fontSize: 12,
    fontWeight: "900"
  },
  assignmentCard: {
    backgroundColor: "#151523",
    borderColor: "#242439",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 28,
    padding: 16
  },
  assignmentLabel: {
    color: "#20c8f4",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  assignmentTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 8
  },
  assignmentMeta: {
    color: "#9aa8b6",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6
  },
  sectionLabel: {
    color: "#777589",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 24,
    textTransform: "uppercase"
  },
  timeButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  timeButton: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 15
  },
  timeButtonActive: {
    backgroundColor: "#20c8f4",
    borderColor: "#20c8f4"
  },
  timeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  timeButtonTextActive: {
    color: "#071018",
    fontSize: 14,
    fontWeight: "900"
  },
  customTimerRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  timerInput: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    color: "#ffffff",
    flex: 0.55,
    fontSize: 15,
    fontWeight: "900",
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  customTimerButton: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  customTimerButtonText: {
    color: "#071018",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  panel: {
    backgroundColor: "#151523",
    borderColor: "#242439",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14
  },
  input: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    color: "#ffffff",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  parkingDescriptionInput: {
    marginTop: 12,
    minHeight: 92,
    paddingTop: 13,
    textAlignVertical: "top"
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  typeChip: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  typeChipActive: {
    backgroundColor: "#20c8f4",
    borderColor: "#20c8f4"
  },
  typeChipText: {
    color: "#b7b5c8",
    fontSize: 13,
    fontWeight: "900"
  },
  typeChipTextActive: {
    color: "#071018"
  },
  vehicleListItem: {
    alignItems: "center",
    borderTopColor: "#242439",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13
  },
  vehicleActions: {
    alignItems: "flex-end",
    gap: 8
  },
  vehicleName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  },
  vehicleType: {
    color: "#777589",
    fontSize: 12,
    marginTop: 4
  },
  linkText: {
    color: "#20c8f4",
    fontSize: 14,
    fontWeight: "900"
  },
  deleteText: {
    color: "#ff6b6b",
    fontSize: 13,
    fontWeight: "900"
  },
  photoModalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.74)",
    flex: 1,
    justifyContent: "flex-end"
  },
  photoModal: {
    backgroundColor: "#11111d",
    borderColor: "#242439",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 28
  },
  photoModalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14
  },
  photoPreview: {
    aspectRatio: 1.1,
    borderRadius: 18,
    width: "100%"
  },
  emptyHistoryText: {
    color: "#9aa8b6",
    fontSize: 14,
    lineHeight: 20
  },
  historyHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  historyCard: {
    backgroundColor: "#151523",
    borderColor: "#242439",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14
  },
  historyTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  historyTitleWrap: {
    flex: 1
  },
  historyMetaRow: {
    borderTopColor: "#242439",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12
  },
  historyMetaText: {
    color: "#777589",
    flex: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  historyActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  historyRouteButton: {
    alignItems: "center",
    backgroundColor: "#0e3448",
    borderColor: "#176783",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13
  },
  historyDeleteButton: {
    alignItems: "center",
    backgroundColor: "#2b1b23",
    borderColor: "#6f2b3c",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13
  }
});

