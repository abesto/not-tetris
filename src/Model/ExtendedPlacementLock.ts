export class ExtendedPlacementLock {
  private static readonly ALLOWED_MOVES = 15;
  private static readonly ALLOWED_TIME = 500;

  private timeLeft: number;
  private movesLeft: number;
  private lowestRow: number | null;

  constructor() {
    this.resetTime();
    this.resetMoves();
    this.resetLowestRow();
  }

  private resetTime() {
    this.timeLeft = ExtendedPlacementLock.ALLOWED_TIME;
  }

  private resetMoves() {
    this.movesLeft = ExtendedPlacementLock.ALLOWED_MOVES;
  }

  private resetLowestRow() {
    this.lowestRow = null;
  }

  shouldLock(): boolean {
    return this.timeLeft <= 0 || this.movesLeft <= 0;
  }

  locked() {
    this.resetMoves();
    this.resetTime();
    this.resetLowestRow();
  }

  moved() {
    this.movesLeft -= 1;
    this.resetTime();
  }

  rotated() {
    this.moved();
  }

  landed(row: number) {
    if (this.lowestRow === null || row < this.lowestRow) {
      this.lowestRow = row;
      this.resetMoves();
    }
  }

  timePassed(delta: number) {
    this.timeLeft -= delta;
  }
}
