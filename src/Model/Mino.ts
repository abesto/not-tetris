import * as Phaser from "phaser";

import * as config from "../config";
import { Cell } from "./Cell";

export enum MinoEvents {
  Change = "change",
  Destroy = "destroy",
  Lock = "lock",
}

export class Mino extends Phaser.Events.EventEmitter {
  color: Phaser.Display.Color;
  readonly cell: Cell;

  constructor(color: Phaser.Display.Color, cell: Cell) {
    super();
    this.color = color;
    this.cell = cell;
  }

  canMoveBy(x: number, y: number) {
    return this.cell.plusCoords(x, y).canBeMovedInto();
  }

  moveBy(x: number, y: number) {
    this.cell.addAssign(x, y);
    this.emit(MinoEvents.Change);
  }

  moveTo(target: Cell | Mino) {
    let cell;
    if (target instanceof Mino) {
      cell = target.cell;
    } else {
      cell = target;
    }
    this.moveToCoords(cell.column, cell.row);
  }

  moveToCoords(column: number, row: number) {
    this.cell.assignCoords(column, row);
    this.emit(MinoEvents.Change);
  }

  isValid(): boolean {
    return this.cell.canBeMovedInto();
  }

  destroy() {
    this.emit(MinoEvents.Destroy);
  }

  lock() {
    this.color = this.color.clone().darken(config.lockDarken);
    this.emit(MinoEvents.Lock);
  }

  get column(): number {
    return this.cell.column;
  }

  get row(): number {
    return this.cell.row;
  }
}
