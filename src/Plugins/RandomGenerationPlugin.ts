import * as Phaser from "phaser";

import { Shape, shapes } from "../Model";
import * as config from "../config";

export class RandomGenerationLogic {
  /** Implements the Tetris Random Generation mechanism */
  nextQueue: Shape[] = [];

  private extendQueueAsNeeded() {
    if (this.nextQueue.length === 0) {
      this.extendQueue();
    }
  }

  private extendQueue() {
    const bag = shapes.slice();

    // Shuffle bag: https://stackoverflow.com/a/12646864
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }

    this.nextQueue = bag;
  }

  shift(): Shape {
    this.extendQueueAsNeeded();
    return this.nextQueue.shift()!;
  }

  shiftMany(n: number): Shape[] {
    const items: Shape[] = [];
    for (let i = 0; i < n; i++) {
      items.push(this.shift());
    }
    return items;
  }

  destroy() {
    this.nextQueue = [];
  }

  reset() {
    this.nextQueue = [];
  }
}

export class RandomGenerationPlugin extends Phaser.Scenes.ScenePlugin {
  logic = new RandomGenerationLogic();

  // noinspection JSUnusedGlobalSymbols
  boot() {
    const eventEmitter = this.systems.events;
    eventEmitter.on("destroy", this.logic.destroy, this);
  }

  shift() {
    return this.logic.shift();
  }

  shiftMany(n: number) {
    return this.logic.shiftMany(n);
  }

  reset() {
    this.logic.reset();
  }
}
