import { Memoize } from "typescript-memoize";

import * as config from "./config";
import Rectangle = Phaser.Geom.Rectangle;

class Coord {
  layout: Layout;
  mino: number;

  constructor(layout: Layout, mino: number) {
    this.layout = layout;
    this.mino = mino;
  }

  plus(other: Coord): Coord {
    if (this.layout !== other.layout) {
      throw new Error("Layout mismatch");
    }
    return new Coord(this.layout, this.mino + other.mino);
  }

  plusRaw(n: number): Coord {
    return new Coord(this.layout, this.mino + n);
  }

  minus(other: Coord): Coord {
    if (this.layout !== other.layout) {
      throw new Error("Layout mismatch");
    }
    return new Coord(this.layout, this.mino - other.mino);
  }

  minusRaw(n: number): Coord {
    return this.plusRaw(-n);
  }

  @Memoize()
  get pixelLow(): number {
    return this.mino * this.layout.cellSize;
  }

  @Memoize()
  get pixelHigh(): number {
    return this.pixelLow + this.layout.cellSize;
  }
}

export class Point {
  x: Coord;
  y: Coord;

  constructor(x: Coord, y: Coord) {
    this.x = x;
    this.y = y;
  }

  get layout(): Layout {
    return this.x.layout;
  }

  plusRaw(x: number, y: number): Point {
    return new Point(this.x.plusRaw(x), this.y.plusRaw(y));
  }

  plus(other: Point): Point {
    return new Point(this.x.plus(other.x), this.y.plus(other.y));
  }

  minus(other: Point): Point {
    return new Point(this.x.minus(other.x), this.y.minus(other.y));
  }

  @Memoize()
  intoMatrix(): Point {
    return this.layout.point(
      this.x.minus(this.layout.matrix.left).mino + 1,
      config.visibleRows + config.skylightRatio - this.y.mino
    );
  }

  @Memoize()
  fromMatrix(): Point {
    return this.layout.point(
      this.x.plus(this.layout.matrix.left).mino - 1,
      this.layout.matrix.bottom.mino - this.y.mino + 1
    );
  }
}

export class Rect {
  topLeft: Point;
  bottomRight: Point;

  constructor(topLeft: Point, bottomRight: Point) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
  }

  get layout(): Layout {
    return this.topLeft.layout;
  }

  get top(): Coord {
    return this.topLeft.y;
  }

  get bottom(): Coord {
    return this.bottomRight.y;
  }

  get left(): Coord {
    return this.topLeft.x;
  }

  get right(): Coord {
    return this.bottomRight.x;
  }

  get width(): Coord {
    return this.right.minus(this.left);
  }

  get height(): Coord {
    return this.bottom.minus(this.top);
  }

  get size(): Rect {
    return new Rect(
      this.layout.point(0, 0),
      this.layout.point(this.width.mino, this.height.mino)
    );
  }

  resized(by: Point): Rect {
    return new Rect(this.topLeft.minus(by), this.bottomRight.plus(by));
  }

  @Memoize()
  get bottomLeft(): Point {
    return this.topLeft.plusRaw(0, this.height.mino);
  }

  @Memoize()
  get topRight(): Point {
    return this.topLeft.plusRaw(this.width.mino, 0);
  }

  @Memoize()
  get center(): Point {
    return this.topLeft.plusRaw(
      this.bottomRight.x.mino / 2,
      this.bottomRight.y.mino / 2
    );
  }

  centerWithin(other: Rect): Rect {
    const topLeft = other.topLeft.plusRaw(
      other.width.minus(this.width).mino / 2,
      other.height.minus(this.height).mino / 2
    );
    return new Rect(topLeft, topLeft.plus(this.size.bottomRight));
  }

  toPhaserPixel(): Rectangle {
    return new Rectangle(
      this.left.pixelLow,
      this.top.pixelLow,
      this.width.pixelHigh,
      this.height.pixelHigh
    );
  }
}

export class Layout {
  private readonly screenWidth: number;
  private readonly screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  coord(mino: number): Coord {
    return new Coord(this, mino);
  }

  point(x: number, y: number): Point {
    return new Point(this.coord(x), this.coord(y));
  }

  rectRaw(x1: number, y1: number, x2: number, y2: number): Rect {
    return this.rect(this.point(x1, y1), this.point(x2, y2));
  }

  rect(topLeft: Point, bottomRight: Point): Rect {
    return new Rect(topLeft, bottomRight);
  }

  @Memoize()
  get cellSize(): number {
    return Math.min(
      this.screenHeight / (this.bottom.mino + 1),
      this.screenWidth / (this.right.mino + 1)
    );
  }

  @Memoize()
  get bottom(): Coord {
    return this.matrixBorder.bottom;
  }

  @Memoize()
  get right(): Coord {
    return this.nextBorder.right;
  }

  @Memoize()
  get blockInsetSize(): number {
    return this.cellSize / 7;
  }

  @Memoize()
  get matrixBorder(): Rect {
    const topLeft = this.point(
      this.holdBorder.right.mino + 2,
      -2 + config.skylightRatio
    );
    return this.rect(
      topLeft,
      topLeft.plusRaw(config.columns + 1, config.visibleRows + 2)
    );
  }

  @Memoize()
  get matrix(): Rect {
    const b = this.matrixBorder;
    return this.rectRaw(
      b.left.mino + 1,
      0,
      b.right.mino - 1,
      b.bottom.mino - 1
    );
  }

  @Memoize()
  get nextBorder(): Rect {
    const topLeft = this.point(
      this.matrixBorder.bottomRight.x.mino + 2,
      config.skylightRatio
    );
    return this.rect(
      topLeft,
      topLeft.plusRaw(config.nextQueueWidth + 1, config.nextHeight + 1)
    );
  }

  @Memoize()
  get nextQueue(): Rect {
    return this.rect(
      this.next.bottomLeft.plusRaw(0, 1),
      this.point(this.next.right.mino, this.bottom.mino - 2)
    );
  }

  @Memoize()
  get next(): Rect {
    return this.nextBorder.resized(this.point(-1, -1));
  }

  @Memoize()
  get holdBorder(): Rect {
    const topLeft = this.point(0, config.skylightRatio);
    return this.rect(
      topLeft,
      topLeft.plusRaw(config.holdWidth + 1, config.holdHeight + 1)
    );
  }

  @Memoize()
  get hold(): Rect {
    return this.holdBorder.resized(this.point(-1, -1));
  }
}

export const layout = new Layout(window.innerWidth, window.innerHeight);
