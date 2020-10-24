import { expect } from "chai";
import { RandomGenerationLogic } from "../src/Plugins/RandomGenerationPlugin";

describe("RandomGeneration", () => {
  // @ts-ignore
  const gen = new RandomGenerationLogic({});

  it("has all the shapes", () => {
    const queue = gen.shiftMany(2 * 7);
    for (let i = 0; i < 2 * 7; i++) {
      queue.push(gen.shift());
    }

    const counts = {};

    for (let item of queue) {
      if (!(item in counts)) {
        counts[item] = 1;
      } else {
        counts[item] += 1;
      }
    }

    expect(Object.keys(counts).length).to.equal(7);

    for (let item in counts) {
      if (!counts.hasOwnProperty(item)) {
        continue;
      }
      expect(counts[item]).to.equal(4);
    }
  });
});
