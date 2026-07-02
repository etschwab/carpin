const { formatCountdown, parseMinutes } = require("../src/utils/time");

// Timer Tests
describe("Etienne - Timer-Hilfsfunktionen", () => {
  // Positivtest
  test("Positivtest: formatCountdown formatiert Millisekunden als h:mm:ss", () => {
    expect(formatCountdown(3_725_000)).toBe("1:02:05");
  });

  // Negativtest
  test("Negativtest: parseMinutes gibt bei ungueltiger Eingabe null zurueck", () => {
    expect(parseMinutes("abc")).toBeNull();
    expect(parseMinutes("0")).toBeNull();
  });
});
