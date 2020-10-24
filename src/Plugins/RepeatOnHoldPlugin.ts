import * as Phaser from "phaser";
import * as config from "../config";

enum RepeatOnHoldState {
  Up,
  Pressed,
  Repeating,
}

export class RepeatOnHoldPlugin extends Phaser.Scenes.ScenePlugin {
  private states: Record<number, RepeatOnHoldState>;
  private firing: Record<number, boolean>;
  private keys: Record<number, Phaser.Input.Keyboard.Key>;

  boot() {
    this.states = {};
    this.firing = {};
    this.keys = {};

    const eventEmitter = this.systems.events;
    eventEmitter.on("update", this.update, this);
  }

  addKey(key: Phaser.Input.Keyboard.Key) {
    this.keys[key.keyCode] = key;
    this.states[key.keyCode] = RepeatOnHoldState.Up;
    this.firing[key.keyCode] = false;
  }

  addKeys(...keys: Phaser.Input.Keyboard.Key[]) {
    for (let key of keys) {
      this.addKey(key);
    }
  }

  update() {
    for (let code in this.keys) {
      if (!this.keys.hasOwnProperty(code)) {
        continue;
      }
      const key = this.keys[code];
      if (key.isUp) {
        if (this.states[code] !== RepeatOnHoldState.Up) {
          key.reset();
          this.states[code] = RepeatOnHoldState.Up;
          this.firing[code] = false;
        }
      } else if (this.states[code] === RepeatOnHoldState.Up) {
        if (this.scene.input.keyboard.checkDown(key, config.delayedAutoShift)) {
          this.states[code] = RepeatOnHoldState.Pressed;
          this.firing[code] = true;
        } else {
          this.firing[code] = false;
        }
      } else if (this.states[code] === RepeatOnHoldState.Pressed) {
        if (this.scene.input.keyboard.checkDown(key, config.delayedAutoShift)) {
          this.states[code] = RepeatOnHoldState.Repeating;
          this.firing[code] = true;
        } else {
          this.firing[code] = false;
        }
      } else if (this.states[code] === RepeatOnHoldState.Repeating) {
        this.firing[code] = this.scene.input.keyboard.checkDown(
          key,
          config.autoRepeatRate
        );
      }
    }
  }

  isFiring(key: Phaser.Input.Keyboard.Key): boolean {
    return this.firing[key.keyCode];
  }
}
