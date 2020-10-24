import * as Phaser from "phaser";

import { layout } from "../Layout";
import * as config from "../config";
import { Matrix } from "./Matrix";

export class InvalidPointError extends Error {}

export class Cell {
  constructor(
    private matrix: Matrix,
    public column: number,
    public row: number
  ) {}

  plus(other: Cell): Cell {
    if (this.matrix !== other.matrix) {
      throw new Error("Cannot sum two Cells from different Matrices");
    }
    return this.plusCoords(other.column, other.row);
  }

  plusCoords(column: number, row: number): Cell {
    return new Cell(this.matrix, this.column + column, this.row + row);
  }

  addAssign(column: number, row: number) {
    this.column += column;
    this.row += row;
  }

  assignCoords(column: number, row: number) {
    this.column = column;
    this.row = row;
  }

  assign(other: Cell) {
    this.assignCoords(other.column, other.row);
  }

  canBeMovedInto(): boolean {
    return this.matrix.canMoveTo(this);
  }

  toSceneTopLeftPixel(): Phaser.Geom.Point {
    const p = layout.point(this.column, this.row).fromMatrix();
    return new Phaser.Geom.Point(p.x.pixelLow, p.y.pixelLow);
  }

  toString(): string {
    return JSON.stringify({ column: this.column, row: this.row });
  }
}
