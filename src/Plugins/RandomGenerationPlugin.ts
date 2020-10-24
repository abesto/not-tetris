import * as Phaser from "phaser";

import { Shape, shapes } from "../Model";
import * as config from "../config";

export class RandomGenerationPlugin extends Phaser.Scenes.ScenePlugin {
  /** Implements the Tetris Random Generation mechanism */
  nextQueue: Shape[] = [];

  // noinspection JSUnusedGlobalSymbols
  boot() {
    const eventEmitter = this.systems.events;
    eventEmitter.on("destroy", this.destroy, this);
  }

  private extendQueueAsNeeded() {
    while (this.nextQueue.length < config.nextQueueLength) {
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

    this.nextQueue = this.nextQueue.concat(...bag);
  }

  shift(): Shape {
    this.extendQueueAsNeeded();
    const next = this.nextQueue.shift()!;
    this.extendQueueAsNeeded();
    return next;
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
}
