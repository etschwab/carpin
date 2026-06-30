# CarPin

CarPin ist ein erster React-Native/Expo-Prototyp fuer iPhone. Die App bildet die Grundlagen aus der Projektdokumentation ab: Fahrzeug auswaehlen, Parkplatz speichern, Foto verknuepfen, Parktimer starten und Route zurueck oeffnen.

## Starten

```powershell
npm install
npm run start
```

Danach den QR-Code mit Expo Go auf dem iPhone scannen. Alternativ kann auf einem Mac mit eingerichtetem iOS-Simulator `npm run ios` verwendet werden.

## Aktueller Stand

- Dashboard mit Logo, Fahrzeugauswahl und Parkplatzstatus
- GPS-Speicherung ueber `expo-location`
- Foto aufnehmen oder aus Galerie auswaehlen ueber `expo-image-picker`
- Route zum gespeicherten Parkplatz ueber Apple Maps
- Parktimer mit 30 Minuten, 1 Stunde und 2 Stunden
- Fahrzeugliste mit lokal gespeicherten Fahrzeugen
- Lokale Persistenz ueber AsyncStorage

## Noch offen

- echte Kartenansicht mit eingezeichneter Route
- Push-Notification vor Ablauf der Parkzeit
- schoenere Detailansicht fuer Fotos und Parkplatzhistorie
- Tests und Testprotokoll gemaess Projektdokumentation
