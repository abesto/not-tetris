import { expect } from "chai";
import { Scoring } from "../src/model";

describe("Scoring", () => {
  it("Correctly calculates combo scores", () => {
    const scoring = new Scoring();

    expect(scoring.score).to.equal(0);

    scoring.cleared(1);
    expect(scoring.score).to.equal(100);
    expect(scoring.linesCleared).to.equal(1);

    scoring.cleared(4);
    expect(scoring.score).to.equal(900);
    expect(scoring.linesCleared).to.equal(9);

    scoring.cleared(4);
    expect(scoring.score).to.equal(2100);
    expect(scoring.linesCleared).to.equal(21);

    scoring.cleared(1);
    expect(scoring.score).to.equal(2200);
    expect(scoring.linesCleared).to.equal(22);

    scoring.cleared(4);
    expect(scoring.score).to.equal(3000);
    expect(scoring.linesCleared).to.equal(30);
  });

  it("levels up as expected", () => {
    const scoring = new Scoring();

    const clearLines = (n) => {
      for (let i = 0; i < n; i++) {
        scoring.cleared(1);
      }
    };

    expect(scoring.goal).to.equal(10);

    clearLines(10);
    expect(scoring.level).to.equal(2);
    expect(scoring.goal - scoring.linesCleared).to.equal(15);

    clearLines(15);
    expect(scoring.level).to.equal(3);
    expect(scoring.goal - scoring.linesCleared).to.equal(20);
  });
});
