import { Mino, Cell, Matrix } from "./";
import * as config from "../config";

export type Shape = "I" | "O" | "T" | "J" | "L" | "S" | "Z";
export const shapes: Shape[] = ["I", "O", "T", "J", "L", "S", "Z"];

export type WallKickTest = 0 | 1 | 2 | 3 | 4;
export type RotationState = 0 | 1 | 2 | 3; // spawn, CW, 2xCW, CCW
export type RotationData = Record<RotationState, boolean[][]>;

type WallKick = { x: number; y: number };
// RotationState -> RotationState -> WallKickTest -> {x,y}
export type WallKickData = Record<
  RotationState,
  Record<RotationState, Record<WallKickTest, WallKick>>
>;

type RotationCandidate = {
  cells: Cell[];
  from: RotationState;
  to: RotationState;
  kick: WallKick;
};

export class TetrominoData {
  readonly rotation: RotationData;
  readonly color: Phaser.Display.Color;
  readonly wallKick: WallKickData;

  constructor(
    rotation: RotationData,
    color: Phaser.Display.Color,
    wallKick: WallKickData
  ) {
    this.rotation = rotation;
    this.color = color;
    this.wallKick = wallKick;
  }
}

export class Tetromino {
  readonly minos: Mino[];

  private readonly rotationTopLeft: Cell;
  private rotationState: RotationState = 0;

  constructor(
    private readonly matrix: Matrix,
    private readonly data: TetrominoData
  ) {
    this.minos = [];

    let spawnShapeSpec = data.rotation[0];
    for (let y = 0; y < spawnShapeSpec.length; y++) {
      let row = spawnShapeSpec.length - y;
      for (let x = 0; x < spawnShapeSpec[y].length; x++) {
        let column = x + 1;
        if (spawnShapeSpec[y][x]) {
          this.minos.push(new Mino(this.color, this.matrix.cell(column, row)));
        }
      }
    }

    this.rotationTopLeft = this.matrix.cell(1, spawnShapeSpec.length);
  }

  get color(): Phaser.Display.Color {
    return this.data.color;
  }

  canMoveBy(column: number, row: number): boolean {
    for (let tile of this.minos) {
      if (!tile.canMoveBy(column, row)) {
        return false;
      }
    }
    return true;
  }

  moveBy(column: number, row: number) {
    for (let tile of this.minos) {
      tile.moveBy(column, row);
    }
    this.rotationTopLeft.addAssign(column, row);
  }

  moveBottomLeftTo(column: number, row: number) {
    const bounds = this.bounds;
    this.moveBy(column - bounds.left, row - bounds.top);
  }

  rotationCandidate(direction: 1 | -1): RotationCandidate {
    let newRotationState = this.rotationState + direction;
    if (newRotationState < 0) {
      newRotationState = 4 + newRotationState;
    }
    newRotationState = newRotationState % 4;

    const shapeSpec = this.data.rotation[newRotationState];
    const cells: Cell[] = [];

    for (let y = 0; y < shapeSpec.length; y++) {
      for (let x = 0; x <= shapeSpec[y].length; x++) {
        if (shapeSpec[y][x]) {
          cells.push(this.rotationTopLeft.plusCoords(x, -y));
        }
      }
    }

    return {
      cells,
      from: this.rotationState,
      to: <RotationState>newRotationState,
      kick: { x: 0, y: 0 },
    };
  }

  kick(candidate: RotationCandidate, test: WallKickTest): RotationCandidate {
    const { x, y } = this.data.wallKick[candidate.from][candidate.to][test];
    return {
      cells: candidate.cells.map((cell) => cell.plusCoords(x, y)),
      from: candidate.from,
      to: candidate.to,
      kick: { x, y },
    };
  }

  isRotationValid(candidate: RotationCandidate): boolean {
    for (let cell of candidate.cells) {
      if (!cell.canBeMovedInto()) {
        return false;
      }
    }
    return true;
  }

  isValid(): boolean {
    for (let mino of this.minos) {
      if (!mino.isValid()) {
        return false;
      }
    }
    return true;
  }

  applyRotationResult(candidate: RotationCandidate) {
    const cells = candidate.cells;
    if (cells.length !== this.minos.length) {
      throw new Error(
        `Wrong number of cells in rotation candidate: ${cells.length} !== ${this.minos.length}`
      );
    }
    for (let i = 0; i < this.minos.length; i++) {
      this.minos[i].moveTo(cells[i]);
    }
    this.rotationState = candidate.to;
    this.rotationTopLeft.addAssign(candidate.kick.x, candidate.kick.y);
  }

  rotate(direction: 1 | -1, validate: boolean = true): boolean {
    const candidate = this.rotationCandidate(direction);

    if (!validate) {
      this.applyRotationResult(candidate);
      return true;
    }

    for (let test = 0; test < 5; test++) {
      const thisCandidate = this.kick(candidate, <WallKickTest>test);
      if (this.isRotationValid(thisCandidate)) {
        this.applyRotationResult(thisCandidate);
        return true;
      }
    }
    return false;
  }

  get bounds(): Phaser.Geom.Rectangle {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (let mino of this.minos) {
      if (mino.column > xMax) {
        xMax = mino.column;
      }
      if (mino.column < xMin) {
        xMin = mino.column;
      }
      if (mino.row > yMax) {
        yMax = mino.row;
      }
      if (mino.row < yMin) {
        yMin = mino.row;
      }
    }
    return new Phaser.Geom.Rectangle(xMin, yMin, xMax - xMin, yMax - yMin);
  }

  ape(other: Tetromino) {
    this.rotationTopLeft.assign(other.rotationTopLeft);
    this.rotationState = other.rotationState;
    for (let i = 0; i < this.minos.length; i++) {
      this.minos[i].moveTo(other.minos[i]);
    }
  }

  clone() {
    return new Tetromino(this.matrix, this.data);
  }

  destroy() {
    for (let mino of this.minos) {
      mino.destroy();
    }
  }

  resetRotation() {
    switch (this.rotationState) {
      case 1:
        this.rotate(-1, false);
        break;
      case 2:
        this.rotate(1, false);
        this.rotate(1, false);
        break;
      case 3:
        this.rotate(1, false);
        break;
      case 0:
    }
  }
}
