// @ts-ignore
import rawData from "../assets/tetromino-data/**/*.txt";
import {
  RotationState,
  Shape,
  shapes,
  TetrominoData,
  WallKickData,
} from "../Model";

type DataType = "color" | "rotation" | "wall-kick";
const dataTypes: DataType[] = ["color", "rotation", "wall-kick"];

const wallKickDataOrder: [RotationState, RotationState][] = [
  [0, 1],
  [1, 0],
  [1, 2],
  [2, 1],
  [2, 3],
  [3, 2],
  [3, 0],
  [0, 3],
];

export class TetrominoDataPlugin extends Phaser.Scenes.ScenePlugin {
  private data: Record<Shape, TetrominoData>;

  getData(shape: Shape): TetrominoData {
    return this.data[shape];
  }

  preload() {
    for (let shape of shapes) {
      for (let dataType of ["color", "rotation"]) {
        this.scene.load.text(
          TetrominoDataPlugin.cacheKey(shape, <DataType>dataType),
          rawData[shape][dataType]
        );
      }
    }
    this.scene.load.text(
      TetrominoDataPlugin.cacheKey("common", "wall-kick"),
      rawData["common-wall-kick"]
    );
    this.scene.load.text(
      TetrominoDataPlugin.cacheKey("I", "wall-kick"),
      rawData.I["wall-kick"]
    );
  }

  private static cacheKey(shape: string, dataType: DataType): string {
    return `tetromino-data/${shape}/${dataType}`;
  }

  preCreate() {
    // @ts-ignore
    this.data = {};
    for (let shape of shapes) {
      this.data[shape] = new TetrominoData(
        TetrominoDataPlugin.parseRotationData(
          this.scene.cache.text.get(
            TetrominoDataPlugin.cacheKey(shape, "rotation")
          )
        ),
        TetrominoDataPlugin.parseColorData(
          this.scene.cache.text.get(
            TetrominoDataPlugin.cacheKey(shape, "color")
          )
        ),
        TetrominoDataPlugin.parseWallKickData(
          this.scene.cache.text.get(
            TetrominoDataPlugin.cacheKey(
              shape === "I" ? "I" : "common",
              "wall-kick"
            )
          )
        )
      );
    }
  }

  private static parseRotationData(
    s: string
  ): Record<RotationState, boolean[][]> {
    const rotations: Record<RotationState, boolean[][]> = {
      0: [],
      1: [],
      2: [],
      3: [],
    };
    let currentShape: boolean[][] = [];

    let currentState: RotationState = 0;
    for (let line of s.split("\n")) {
      line = line.trim();
      if (line.length === 0 && currentShape.length !== 0) {
        rotations[currentState++] = currentShape;
        currentShape = [];
      } else {
        let lineParsed: boolean[] = [];
        for (let char of line) {
          lineParsed.push(!!parseInt(char, 10));
        }
        currentShape.push(lineParsed);
      }
    }

    if (currentShape.length !== 0) {
      rotations[currentState] = currentShape;
    }

    return rotations;
  }

  private static parseWallKickData(s: string): WallKickData {
    const data = {};

    const lines = s.split("\n").map((line) => line.trim());
    if (lines.length !== 8) {
      throw new Error(
        `Wall kick data file is required to  have 8 lines, found ${lines.length}`
      );
    }

    for (
      let lineNumber = 0;
      lineNumber < wallKickDataOrder.length;
      lineNumber++
    ) {
      const [from, to] = wallKickDataOrder[lineNumber];
      if (!(from in data)) {
        data[from] = {};
      }
      if (!(to in data[from])) {
        data[from][to] = {};
      }
      const testEntries = lines[lineNumber].split(" ");
      if (testEntries.length !== 5) {
        throw new Error(
          `Each line of wall kick data file must have 5 entries, found ${testEntries.length} on line ${lineNumber}`
        );
      }

      for (let testNumber = 0; testNumber < testEntries.length; testNumber++) {
        let [xStr, yStr] = testEntries[testNumber].split(",");
        let [x, y] = [parseInt(xStr, 10), parseInt(yStr, 10)];
        data[from][to][testNumber] = { x, y };
      }
    }

    return <WallKickData>data;
  }

  private static parseColorData(s: string): Phaser.Display.Color {
    return new Phaser.Display.Color(
      ...s
        .trim()
        .split(" ")
        .map((x) => parseInt(x, 10))
    );
  }
}
