# LB3 Testdokumentation - Etienne

## Komponente / Feature

Etienne testet die Dashboard- und Timer-Anzeige von CarPin. Dazu gehoeren:

- Timer-Hilfsfunktionen fuer Countdown und benutzerdefinierte Parkdauer
- Statuskachel im Dashboard / Fullscreen, die Werte wie Foto, Timer oder Fahrzeug anzeigt

## Testumgebung

- Branch: `feature/tests-etienne`
- Testframework: Jest mit `jest-expo`
- Snapshot-Renderer: `react-test-renderer`
- Ausfuehren mit: `npm test`

## Testfaelle

| ID | Art | Ziel | Eingabe / Aktion | Erwartetes Resultat |
| --- | --- | --- | --- | --- |
| ET-UT-01 | Unit Positivtest | Countdown korrekt formatieren | `formatCountdown(3_725_000)` | Rueckgabe ist `1:02:05` |
| ET-UT-02 | Unit Negativtest | Ungueltige Parkdauer ablehnen | `parseMinutes("abc")` und `parseMinutes("0")` | Rueckgabe ist jeweils `null` |
| ET-ST-01 | Snapshot Test | Statuskachel bleibt visuell/strukturell stabil | `FullInfoTile` mit Icon `P`, Label `Foto`, Wert `gespeichert` rendern | Snapshot stimmt mit gespeicherter Struktur ueberein |

## Testprotokoll

| Datum | Testlauf | Resultat | Bemerkung |
| --- | --- | --- | --- |
| 2026-07-02 | `npm test` | Erfolgreich | 2 Test-Suites bestanden, 3 Tests bestanden, 1 Snapshot bestanden |

## Begruendung

Die Unit Tests pruefen bewusst eine positive und eine negative Logikstelle. Damit wird gezeigt, dass die Timer-Anzeige korrekte Werte darstellen kann und falsche Eingaben nicht akzeptiert werden. Der Snapshot Test prueft eine UI-Komponente, die im Dashboard fuer Statusinformationen verwendet wird. Dadurch faellt auf, wenn sich die Struktur der Anzeige unbeabsichtigt aendert.
