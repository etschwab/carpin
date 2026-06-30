# Commit- und Feature-Uebersicht

Diese Uebersicht teilt die Entwicklung von CarPin in kleine, praesentierbare Feature-Schritte auf. Sie ist bewusst feiner gegliedert als die reine Git-History, damit klar wird, welche Funktion wann entstanden ist und was man im Code zeigen kann.

## 1. Projektstart und Expo-Grundlage

**Branch:** `feature/app-grundlage`  
**Commit:** `157c17b Add Expo React Native app foundation`

Ziel dieses Schrittes war eine startbare React-Native-App fuer iPhone.

- Expo/React Native mit TypeScript eingerichtet
- `app.json`, `tsconfig.json`, `babel.config.js` und `package.json` angelegt
- Logo `carpin.png` eingebunden
- App mit `npm run start` in Expo Go startbar gemacht

**Code zeigen:** `package.json`, `app.json`, `App.tsx`

## 2. Grundnavigation und Screens

**Commit-Bereich:** `157c17b`

Hier wurde die erste App-Struktur erstellt.

- Screen `Parken`
- Screen `Timer`
- Screen `Fahrzeuge`
- einfache Tab-Navigation innerhalb von `App.tsx`
- Grundzustand mit React State vorbereitet

**Code zeigen:** `type Screen`, `screen`-State und die drei Screen-Bloecke in `App.tsx`

## 3. Fahrzeugverwaltung

**Commit-Bereich:** `157c17b`, erweitert in `feature/vehicle-delete-and-detailed-overview`

Die Fahrzeugverwaltung ist ein eigener Feature-Bereich.

- Standardfahrzeuge angelegt
- neues Fahrzeug mit Name und Typ erfassen
- Fahrzeug auswaehlen
- Fahrzeug lokal speichern
- Fahrzeug loeschen
- Schutz: Das letzte Fahrzeug kann nicht geloescht werden
- Schutz: Ein Fahrzeug mit aktivem Parkplatz kann nicht geloescht werden

**Code zeigen:** `Vehicle`, `DEFAULT_VEHICLES`, `addVehicle`, `deleteVehicle`

## 4. Lokale Persistenz

**Commit-Bereich:** `157c17b`, erweitert in `1573217`

Die wichtigsten Daten bleiben nach einem Neustart erhalten.

- Fahrzeuge werden in AsyncStorage gespeichert
- aktiver Parkplatz wird gespeichert
- Timer-Endzeit wird gespeichert
- spaeter ergaenzt:
  - Timer-Startzeit
  - Zuordnung Timer zu Parkplatz

**Code zeigen:** `STORAGE_KEYS` und die `useEffect`-Bloecke mit `AsyncStorage`

## 5. Parkplatz speichern

**Commit-Bereich:** `157c17b`, verbessert in `1573217`

Der Parkplatz-Speicherprozess wurde schrittweise verbessert.

- zuerst einfache GPS-Speicherung
- spaeter echte Standortabfrage beim App-Start
- Karte zentriert auf aktuellen Standort
- Parkplatz speichern nutzt den aktuellen Handy-Standort
- Adresse wird ueber Reverse Geocoding gelesen, wenn moeglich

**Code zeigen:** `getDeviceLocation`, `refreshCurrentLocation`, `saveParkingSpot`, `reverseGeocode`

## 6. Kartenansicht

**Branch:** `fix/cleanup-map-ui`  
**Commit:** `7ae83bd Clean up controls and add real map view`  
**Merge:** `32692e8 Merge branch 'fix/cleanup-map-ui'`

Die Karte wurde bewusst als eigenes Feature weiterentwickelt.

- Fake-Karte entfernt
- `react-native-maps` installiert
- echte `MapView` eingebaut
- Marker fuer aktuellen Standort
- Marker fuer gespeicherten Parkplatz
- einfache Linie zwischen Standort und Parkplatz
- Button zum erneuten Laden des Standorts

**Code zeigen:** `CarPinMap`, `MapView`, `Marker`, `Polyline`, `MAP_DARK_STYLE`

## 7. Apple-Maps-Rueckweg

**Commit-Bereich:** `157c17b`, beibehalten in allen weiteren UI-Versionen

Die App hat weiterhin eine native Rueckweg-Funktion ueber Apple Maps.

- gespeicherte Koordinaten werden an Apple Maps uebergeben
- Gehroute wird ausserhalb der App geoeffnet
- eigene Kartenansicht bleibt parallel in CarPin sichtbar

**Code zeigen:** `openRoute`

## 8. Parkplatzfoto

**Commit-Bereich:** `157c17b`, verbessert in `1573217`

Das Foto-Feature wurde von einer einfachen Anzeige zu einem besseren Ablauf erweitert.

- Foto mit Kamera aufnehmen
- Foto aus Galerie waehlen
- Foto wird mit aktivem Parkplatz verknuepft
- Foto wird nicht dauerhaft im Bottom-Sheet angezeigt
- Foto erscheint erst nach Klick auf `Foto anzeigen`
- eigene Foto-Vorschau mit Modal

**Code zeigen:** `pickPhoto`, `isPhotoVisible`, `Modal`, `photoPreview`

## 9. Parktimer

**Commit-Bereich:** `157c17b`, verbessert in `1573217`

Der Timer ist ein eigener Funktionsbereich.

- vordefinierte Zeiten:
  - 30 Minuten
  - 1 Stunde
  - 2 Stunden
- benutzerdefiniertes Minutenfeld
- Timer kann nicht ohne gespeicherten Parkplatz gestartet werden
- Timer wird dem aktuellen Parkplatz zugeteilt
- Timerdaten werden lokal gespeichert

**Code zeigen:** `startTimer`, `startCustomTimer`, `timerSpotId`, `timerStartedAt`, `customTimerMinutes`

## 10. Design-Ueberarbeitung

**Commit:** `8f119c4 Restyle app with dark map interface`

In diesem Schritt wurde das einfache Grundlayout optisch in Richtung CarPin-Mockup gebracht.

- dunkles Interface
- Cyan-Akzentfarbe
- Bottom-Sheet fuer Parkplatzdetails
- Timer-Ring
- Kartenfokus als Hauptscreen

**Code zeigen:** `styles`, `bottomSheet`, `timerRing`, `savedCard`

## 11. UI-Cleanup

**Commit:** `7ae83bd Clean up controls and add real map view`

Hier wurden Elemente entfernt, die nur nach Mockup aussahen, aber keine echte Funktion hatten.

- Drei-Striche-Button oben entfernt
- reine Deko-Buttons auf der Karte entfernt
- benutzerdefinierten Timer erst entfernt, spaeter funktional wieder eingebaut

**Code zeigen:** Vergleich zwischen alter Doku/History und aktuellem `App.tsx`

## 12. GitLab-CI

**Commits:**  
`55d2d25 Add GitLab CI validation pipeline`  
`a8c8ebc Fix GitLab CI validation job`  
`1b806d6 Merge branch 'fix/gitlab-ci-pipeline'`

Die Pipeline wurde als eigenes Infrastruktur-Feature gepflegt.

- GitLab-CI-Datei erstellt
- Node-Image auf `node:20-bookworm` angepasst
- Installation mit `npm ci`
- TypeScript-Check
- Expo-iOS-Export als Build-Nachweis

**Code zeigen:** `.gitlab-ci.yml`

## 13. Dokumentation der Entwicklung

**Branch:** `docs/commit-overview`  
**Commit:** `14712c3 Add feature commit overview`

Damit die Entwicklung im GitLab besser nachvollziehbar ist, wurde diese Feature-Uebersicht erstellt.

- Feature-Bloecke statt nur grosser Merge-History
- Code-Stellen fuer Demo und Fachgespraech
- README verweist auf diese Uebersicht

**Code zeigen:** `docs/commit-overview.md`, `README.md`

## Empfohlene Praesentationsreihenfolge

1. Projektstart: Expo-App starten und Grundstruktur zeigen.
2. Fahrzeugverwaltung: Fahrzeug hinzufuegen, auswaehlen und loeschen.
3. Parkplatz speichern: Standortzugriff und Speichern erklaeren.
4. Kartenansicht: `react-native-maps`, Marker und Linie zeigen.
5. Foto: Kamera/Galerie und Foto-Vorschau zeigen.
6. Timer: vordefinierte Zeiten, benutzerdefiniertes Feld und Parkplatz-Zuordnung zeigen.
7. Pipeline: `.gitlab-ci.yml` und automatische Checks zeigen.

## Wichtige Dateien fuer die Code-Demo

- `App.tsx`: Hauptlogik, Screens, Karte, Timer, Foto und Fahrzeugverwaltung
- `package.json`: Expo-Abhaengigkeiten und Startskripte
- `.gitlab-ci.yml`: Pipeline mit Installations-, Typecheck- und Expo-Export-Schritt
- `app.json`: Expo-Konfiguration und iOS-Berechtigungen
- `docs/commit-overview.md`: Feature- und Commit-Uebersicht
