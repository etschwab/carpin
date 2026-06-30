# Commit- und Feature-Uebersicht

Diese Uebersicht erklaert die Entwicklung von CarPin in nachvollziehbaren Feature-Bloecken. So ist erkennbar, dass die App schrittweise aufgebaut wurde und nicht als ein einzelner grosser Code-Dump entstanden ist.

## 1. App-Grundlage

**Branch:** `feature/app-grundlage`  
**Commit:** `157c17b Add Expo React Native app foundation`

In diesem Schritt wurde die erste startbare React-Native/Expo-App erstellt.

- Expo-Projektstruktur mit TypeScript eingerichtet
- Logo `carpin.png` eingebunden
- Grundseiten angelegt: Parken, Timer, Fahrzeuge
- lokale Speicherung mit AsyncStorage vorbereitet
- erste Funktionen eingebaut:
  - Parkplatz speichern
  - Foto aufnehmen oder aus Galerie waehlen
  - Route mit Apple Maps oeffnen
  - Fahrzeuge hinzufuegen und auswaehlen
  - Parktimer starten

## 2. GitLab-CI-Grundlage

**Commit:** `55d2d25 Add GitLab CI validation pipeline`

Hier wurde eine einfache GitLab-Pipeline ergaenzt, damit das Projekt automatisch geprueft werden kann.

- `.gitlab-ci.yml` erstellt
- Installationsschritt mit `npm ci`
- TypeScript-Pruefung mit `npm run typecheck`
- Expo-Kompatibilitaet im CI-Kontext vorbereitet

## 3. Dunkles App-Design

**Commit:** `8f119c4 Restyle app with dark map interface`

Dieser Schritt hat das erste einfache Layout in ein CarPin-Design nach Mockup-Richtung umgebaut.

- dunkles Interface mit Cyan-Akzent
- Bottom-Sheet fuer Parkplatzdetails
- Timer-Ansicht optisch ueberarbeitet
- Fahrzeugseite optisch angepasst
- Apple-Maps-Funktion beibehalten

## 4. Pipeline-Fix

**Branch:** `fix/gitlab-ci-pipeline`  
**Commit:** `a8c8ebc Fix GitLab CI validation job`  
**Merge:** `1b806d6 Merge branch 'fix/gitlab-ci-pipeline'`

Nachdem die Pipeline weiterhin fehlgeschlagen ist, wurde sie stabiler gemacht.

- Node-Image auf `node:20-bookworm` angepasst
- unnoetig fragilen Expo-Installcheck aus der Pipeline entfernt
- stattdessen ein echter Expo-Bundle-Test ergaenzt
- finale CI-Schritte:
  - `npm ci --prefer-offline --no-audit`
  - `npm run typecheck`
  - `npx expo export --platform ios --output-dir dist --clear`

## 5. Echte Kartenansicht und UI-Cleanup

**Branch:** `fix/cleanup-map-ui`  
**Commit:** `7ae83bd Clean up controls and add real map view`  
**Merge:** `32692e8 Merge branch 'fix/cleanup-map-ui'`

Hier wurde die gezeichnete Fake-Karte durch eine echte Kartenkomponente ersetzt.

- `react-native-maps` installiert
- echte `MapView` eingebaut
- Marker fuer Standort und Parkplatz ergaenzt
- visuelle Linie zwischen Standort und Parkplatz eingebaut
- unnoetige UI-Buttons entfernt:
  - Drei-Striche-Button oben
  - reine Mockup-Buttons auf der Karte
- nicht funktionierenden benutzerdefinierten Timer vorerst entfernt

## 6. Standort, Foto und Timer verbessert

**Branch:** `feature/location-photo-timer-polish`  
**Commit:** `1573217 Improve location map photo and timer flow`

Dieser Schritt verbessert das Verhalten der App, damit sie weniger abgehackt wirkt.

- Karte fragt beim Start den echten Handy-Standort ab
- Kartenansicht zentriert nicht mehr standardmaessig sichtbar auf Zuerich
- Parkplatz speichern nutzt den aktuellen Standort
- Standort kann manuell neu geladen werden
- Foto wird erst nach Klick auf `Foto anzeigen` angezeigt
- Fotoanzeige erfolgt in einer eigenen Vorschau
- Timer hat wieder ein benutzerdefiniertes Minutenfeld
- Timer wird dem aktuell gespeicherten Parkplatz zugeteilt
- Timer kann nicht ohne gespeicherten Parkplatz gestartet werden

## Empfohlene Praesentationsreihenfolge

1. `feature/app-grundlage`: Grundapp und Hauptfunktionen zeigen.
2. `.gitlab-ci.yml`: zeigen, wie die Pipeline prueft, ob die App baubar ist.
3. `8f119c4`: Designentwicklung erklaeren.
4. `fix/cleanup-map-ui`: echte Kartenansicht zeigen.
5. `feature/location-photo-timer-polish`: verbesserten Ablauf mit Standort, Foto und Timer zeigen.

## Wichtige Dateien fuer die Code-Demo

- `App.tsx`: Hauptlogik, Screens, Karte, Timer und Fotoanzeige
- `package.json`: Expo-Abhaengigkeiten und Startskripte
- `.gitlab-ci.yml`: Pipeline mit Installations-, Typecheck- und Expo-Export-Schritt
- `app.json`: Expo-Konfiguration und iOS-Berechtigungen
