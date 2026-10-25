import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder } from "react-native";

import { SHEET_HEIGHTS } from "../constants/appConstants";
import type { SheetMode } from "../types/parking";

const SPRING_CONFIG = {
  damping: 24,
  mass: 0.9,
  stiffness: 190,
  useNativeDriver: false
};

// Bottom Sheet / Hoehen / Grenzen
function clampSheetHeight(height: number) {
  return Math.min(SHEET_HEIGHTS.full, Math.max(SHEET_HEIGHTS.compact, height));
}

function nearestSheetMode(height: number): SheetMode {
  return (Object.keys(SHEET_HEIGHTS) as SheetMode[]).reduce((nearestMode, mode) => {
    const nearestDistance = Math.abs(SHEET_HEIGHTS[nearestMode] - height);
    const modeDistance = Math.abs(SHEET_HEIGHTS[mode] - height);
    return modeDistance < nearestDistance ? mode : nearestMode;
  }, "mid");
}

// Bottom Sheet / Animation / Drag Panel
export function useBottomSheet() {
  const [sheetMode, setSheetMode] = useState<SheetMode>("mid");
  const sheetHeight = useRef(new Animated.Value(SHEET_HEIGHTS.mid)).current;
  const sheetDragStartHeight = useRef(SHEET_HEIGHTS.mid);
  const sheetCurrentHeight = useRef(SHEET_HEIGHTS.mid);

  useEffect(() => {
    Animated.spring(sheetHeight, { toValue: SHEET_HEIGHTS[sheetMode], ...SPRING_CONFIG }).start(() => {
      sheetCurrentHeight.current = SHEET_HEIGHTS[sheetMode];
    });
  }, [sheetHeight, sheetMode]);

  function snapSheetToMode(mode: SheetMode) {
    Animated.spring(sheetHeight, { toValue: SHEET_HEIGHTS[mode], ...SPRING_CONFIG }).start(() => {
      sheetCurrentHeight.current = SHEET_HEIGHTS[mode];
    });
    setSheetMode(mode);
  }

  function toggleSheetMode() {
    setSheetMode((currentMode) => {
      if (currentMode === "compact") {
        return "mid";
      }

      if (currentMode === "mid") {
        return "full";
      }

      return "compact";
    });
  }

  // Bottom Sheet / Ziehen / Gesten
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2,
        onPanResponderGrant: () => {
          sheetHeight.stopAnimation((height) => {
            sheetDragStartHeight.current = height;
            sheetCurrentHeight.current = height;
          });
        },
        onPanResponderMove: (_event, gesture) => {
          const nextHeight = clampSheetHeight(sheetDragStartHeight.current - gesture.dy);
          sheetCurrentHeight.current = nextHeight;
          sheetHeight.setValue(nextHeight);
        },
        onPanResponderRelease: (_event, gesture) => {
          const projectedHeight = clampSheetHeight(sheetCurrentHeight.current - gesture.vy * 120);

          if (gesture.vy < -0.85) {
            snapSheetToMode(sheetMode === "compact" ? "mid" : "full");
            return;
          }

          if (gesture.vy > 0.85) {
            snapSheetToMode(sheetMode === "full" ? "mid" : "compact");
            return;
          }

          snapSheetToMode(nearestSheetMode(projectedHeight));
        },
        onPanResponderTerminate: () => {
          snapSheetToMode(nearestSheetMode(sheetCurrentHeight.current));
        }
      }),
    [sheetHeight, sheetMode]
  );

  return {
    bottomSheetAnimatedStyle: { height: sheetHeight },
    sheetMode,
    sheetPanHandlers: sheetPanResponder.panHandlers,
    toggleSheetMode
  };
}
