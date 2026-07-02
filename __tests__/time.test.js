const { formatCountdown, parseMinutes } = require("../src/utils/time");

describe("Etienne - Timer-Hilfsfunktionen", () => {
  test("Positivtest: formatCountdown formatiert Millisekunden als h:mm:ss", () => {
    expect(formatCountdown(3_725_000)).toBe("1:02:05");
  });

  test("Negativtest: parseMinutes gibt bei ungueltiger Eingabe null zurueck", () => {
    expect(parseMinutes("abc")).toBeNull();
    expect(parseMinutes("0")).toBeNull();
  });
});
