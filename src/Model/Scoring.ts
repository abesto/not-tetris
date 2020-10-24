export class Scoring {
  score: number;
  level: number;
  goal: number;
  tetrises: number;
  combos: number;

  private combo: boolean = false;
  private goalIncrement = 15;

  constructor() {
    this.reset();
  }

  cleared(lines: number): string[] {
    const messages: string[] = [];
    const wasCombo = this.combo;

    switch (lines) {
      case 1:
        this.score += 100;
        this.combo = false;
        messages.push("Single clear");
        break;
      case 2:
        this.score += 300;
        this.combo = false;
        messages.push("Double Clear!");
        break;
      case 3:
        this.score += 500;
        this.combo = false;
        messages.push("TRIPLE Clear!!");
        break;
      case 4:
        this.score += 800;
        this.tetrises += 1;
        messages.push("TETRIS!!11");
        if (this.combo) {
          this.score += 400;
          this.combos += 1;
        }
        this.combo = true;
        break;
      default:
        throw new Error(
          `Hey how did you clear more than 4 (or less than 1?!) lines in one go`
        );
    }

    if (wasCombo) {
      if (this.combo) {
        messages.push("Combo!");
      } else {
        messages.push("C-C-Combo breaker!");
      }
    }

    if (this.updateLevel()) {
      messages.push("Next Level!");
    }

    return messages;
  }

  get linesCleared(): number {
    return this.score / 100;
  }

  private updateLevel(): boolean {
    if (this.linesCleared >= this.goal) {
      this.level += 1;
      this.goal += this.goalIncrement;
      this.goalIncrement += 5;
      return true;
    }
    return false;
  }

  softDrop() {
    this.score += 1;
  }

  hardDrop(lines: number) {
    this.score += lines * 2;
  }

  reset() {
    this.score = 0;
    this.goal = 10;
    this.level = 1;
    this.tetrises = 0;
    this.combos = 0;
  }
}
