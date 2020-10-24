import { expect } from "chai";

import * as config from "../src/config";
import { Layout } from "../src/Layout";

describe("Layout", () => {
  const layout = new Layout(1000, 500);

  it("looks roughly sane", () => {
    expect(layout.matrix.topLeft).to.deep.equal(layout.point(9, 0));
    expect(layout.matrix.bottomRight).to.deep.equal(layout.point(18, 19.2));
  });

  describe("correctly transforms into and out of the matrix reference system", () => {
    it("looks roughly sane", () => {
      expect(layout.point(2, 1).fromMatrix()).to.deep.equal(
        layout.point(10, 19.2)
      );
    });

    for (let row = 1; row <= config.visibleRows; row++) {
      for (let column = 1; column <= config.columns; column++) {
        it(` (row=${row},column=${column})`, () => {
          const pM = layout.point(column, row);
          const p = pM.fromMatrix();
          expect(p).to.deep.equal(
            layout.matrix.bottomLeft.plusRaw(column - 1, -row + 1),
            "fromMatrix"
          );
          expect(p.intoMatrix()).to.deep.equal(pM, "intoMatrix");
        });
      }
    }
  });
});
