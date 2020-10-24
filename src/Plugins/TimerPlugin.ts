export class Timer {
  private sinceLastFire: number;
  private interval: number;
  private _isFiring: boolean;

  constructor(interval: number) {
    this.interval = interval;
    this.reset();
  }

  update(delta: number) {
    this.sinceLastFire += delta;
    if (this.sinceLastFire >= this.interval) {
      this._isFiring = true;
      this.sinceLastFire = 0;
    } else {
      this._isFiring = false;
    }
  }

  setInterval(interval: number, resetIfChanged: boolean = false): Timer {
    if (this.interval !== interval) {
      if (resetIfChanged) {
        this.reset();
      }
      this.interval = interval;
    }
    return this;
  }

  reset(): Timer {
    this._isFiring = true;
    this.sinceLastFire = 0;
    return this;
  }

  get isFiring(): boolean {
    return this._isFiring;
  }
}

export class TimerPlugin extends Phaser.Scenes.ScenePlugin {
  private timers: Record<string, Timer> = {};

  boot() {
    const eventEmitter = this.systems.events;
    eventEmitter.on("update", this.update, this);
    eventEmitter.on("destroy", this.destroy, this);
  }

  addTimer(key: string, interval: number): Timer {
    if (key in this.timers) {
      return this.timers[key].setInterval(interval).reset();
    }
    const timer = new Timer(interval);
    this.timers[key] = timer;
    return timer;
  }

  clearTimer(key: string) {
    if (!(key in this.timers)) {
      return;
    }
    delete this.timers[key];
  }

  isFiring(key: string): boolean {
    if (!(key in this.timers)) {
      return false;
    }
    return this.timers[key].isFiring;
  }

  getTimer(key: string): Timer {
    return this.timers[key]!!;
  }

  update(time: number, delta: number) {
    for (let key in this.timers) {
      if (!this.timers.hasOwnProperty(key)) {
        continue;
      }
      this.timers[key].update(delta);
    }
  }

  destroy() {
    this.timers = {};
  }
}
