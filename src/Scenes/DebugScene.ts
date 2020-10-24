import * as Phaser from "phaser";

import { Timer } from "../Plugins";
import { Shape, Tetromino } from "../Model";
import { MinoGameObject } from "../MyGameObjects";
import * as config from "../config";

type Command = "left" | "right" | "up" | "down" | "rotateCW"; //| "rotate-ccw";
//| "next-shape";

const moveSpec: Record<Command, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  rotateCW: { x: 0, y: 0 },
};

export class DebugScene extends Phaser.Scene {
  model: Tetromino;
  gameObject: Phaser.GameObjects.Group;

  keys: Record<Command, Phaser.Input.Keyboard.Key>;

  createTetromino() {
    const shape: Shape = "I";
    this.model = new Tetromino(this.tetrominoData.getData(shape));
    this.model.moveBottomLeftTo(4, 1);
    this.gameObject = this.add.tetromino(this.model);
  }

  // noinspection JSUnusedGlobalSymbols
  preload() {
    // TODO there should be a better way
    this.tetrominoData.preload();
  }

  // noinspection JSUnusedGlobalSymbols
  create() {
    // TODO there should be a better way
    this.tetrominoData.preCreate();
    this.createKeys();
    this.createTetromino();
  }

  createKeys() {
    this.keys = {
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      rotateCW: this.input.keyboard.addKey("x"),
    };
  }

  update(time: number, delta: number) {
    super.update(time, delta);
    this.move(time, delta);
    this.rotate(time, delta);
  }

  move(time: number, delta: number) {
    Object.keys(moveSpec).forEach((command) => {
      const { x, y } = moveSpec[command];
      if (
        this.input.keyboard.checkDown(
          this.keys[command],
          config.autoRepeatRate
        ) &&
        this.model.canMoveBy(x, y)
      ) {
        this.model.moveBy(x, y);
      }
    });
  }

  rotate(time: number, delta: number) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.rotateCW)) {
      this.model.rotate(1);
    }
  }

  destroy() {
    this.gameObject.destroy(true);
    Object.values(this.keys).forEach((key) => key.destroy());
  }
}
