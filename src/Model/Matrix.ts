import * as config from "../config";
import { Mino } from "./Mino";
import { Tetromino, TetrominoData } from "./Tetromino";
import { Cell } from "./Cell";

export class LockOut extends Error {}

export class Matrix {
  readonly columns: number;
  readonly rows: number;

  private readonly blocks: (Mino | null)[][];

  constructor() {
    this.columns = config.columns;
    this.rows = config.rows;
    this.blocks = new Array(this.columns)
      .fill(0)
      .map(() => new Array(this.rows).fill(null));
  }

  lock(tetromino: Tetromino) {
    tetromino.minos.forEach((mino) => {
      if (!this.isEmpty(mino.cell)) {
        throw new LockOut(
          `Tried to lock a mino at ${mino.cell}, but there is already a block there`
        );
      }
      this.blocks[mino.cell.column - 1][mino.cell.row - 1] = mino;
      mino.lock();
    });
  }

  private getBlock(cell: Cell): Mino | null {
    return this.getBlockCoords(cell.column, cell.row);
  }

  private getBlockCoords(column: number, row: number): Mino | null {
    return this.blocks[column - 1][row - 1];
  }

  private setBlock(cell: Cell, mino: Mino | null) {
    this.setBlockCoords(cell.column, cell.row, mino);
  }

  private setBlockCoords(column: number, row: number, mino: Mino | null) {
    this.blocks[column - 1][row - 1] = mino;
  }

  clearCell(column: number, row: number) {
    this.getBlockCoords(column, row)!.destroy();
    this.setBlockCoords(column, row, null);
  }

  clear() {
    for (let row = 1; row <= this.rows; row++) {
      this.clearRow(row);
    }
  }

  clearRow(row: number) {
    for (let column = 1; column <= this.columns; column++) {
      if (!this.isEmptyCoords(column, row)) {
        this.clearCell(column, row);
      }
    }
  }

  isRowFilled(row: number): boolean {
    for (let column = 1; column <= this.columns; column++) {
      if (this.isEmptyCoords(column, row)) {
        return false;
      }
    }
    return true;
  }

  shiftDown(fromRow: number) {
    for (let row = fromRow; row <= this.rows; row++) {
      for (let column = 1; column <= this.columns; column++) {
        const block = this.blocks[column - 1][row - 1];
        if (block === null) {
          continue;
        }
        this.setBlockCoords(column, row, null);
        block.moveBy(0, -1);
        this.setBlock(block.cell, block);
      }
    }
  }

  cell(column: number, row: number): Cell {
    return new Cell(this, column, row);
  }

  tetromino(data: TetrominoData): Tetromino {
    return new Tetromino(this, data);
  }

  isValid(cell: Cell): boolean {
    return this.isValidColumn(cell.column) && this.isValidRow(cell.row);
  }

  isValidColumn(column: number): boolean {
    return column >= 1 && column <= this.columns;
  }

  isValidRow(row: number): boolean {
    return row >= 1 && row <= this.rows;
  }

  isEmpty(cell: Cell): boolean {
    return this.isEmptyCoords(cell.column, cell.row);
  }

  isEmptyCoords(column: number, row: number): boolean {
    return this.getBlockCoords(column, row) === null;
  }

  canMoveTo(cell: Cell): boolean {
    return this.isValid(cell) && this.isEmpty(cell);
  }
}
