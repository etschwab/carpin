const React = require("react");
const renderer = require("react-test-renderer");
const { act } = renderer;

const { FullInfoTile } = require("../src/components/FullInfoTile");

// Snapshot Test
describe("Etienne - Dashboard-Statuskachel", () => {
  test("Snapshot: FullInfoTile rendert Label, Wert und Icon stabil", () => {
    let component;

    act(() => {
      component = renderer.create(React.createElement(FullInfoTile, { icon: "P", label: "Foto", value: "gespeichert" }));
    });

    const tree = component.toJSON();

    expect(tree).toMatchSnapshot();
  });
});
