import * as Phaser from "phaser";
import * as config from "../config";
import { layout } from "../Layout";

namespace States {
  export enum StateType {
    Idle,
    Drag,
  }

  export type State =
    | { type: StateType.Idle; acted: boolean }
    | {
        type: StateType.Drag;
        lastConsumedX: number;
        lastConsumedY: number;
        acted: boolean;
      };

  export function idle(acted: boolean = false): State {
    return { type: StateType.Idle, acted };
  }

  function drag(
    lastConsumedX: number,
    lastConsumedY: number,
    acted: boolean
  ): State {
    return { type: StateType.Drag, lastConsumedX, lastConsumedY, acted };
  }

  class Output {
    constructor(
      readonly state: State,
      readonly action: config.Action | null = null
    ) {}
  }

  export function transition(
    state: State,
    pointer: Phaser.Input.Pointer,
    justUp: boolean
  ): Output | null {
    switch (state.type) {
      case States.StateType.Idle:
        if (!state.acted && pointer.isDown) {
          return new Output(drag(pointer.x, pointer.y, false));
        }
        if (state.acted && !pointer.isDown) {
          return new Output(idle());
        }
        break;

      case States.StateType.Drag:
        const deltaX = pointer.x - state.lastConsumedX;
        if (deltaX < -layout.cellSize) {
          return new Output(drag(pointer.x, pointer.y, true), "left");
        }
        if (deltaX > layout.cellSize) {
          return new Output(drag(pointer.x, pointer.y, true), "right");
        }

        const deltaY = pointer.y - state.lastConsumedY;
        if (deltaY > layout.cellSize) {
          if (
            pointer.velocity.length() >=
            layout.cellSize * config.hardDropCellThreshold
          ) {
            return new Output(idle(true), "hardDrop");
          }
          return new Output(drag(pointer.x, pointer.y, true), "softDrop");
        }

        if (justUp) {
          if (!state.acted && pointer.getDuration() <= config.tapDuration) {
            return new Output(idle(state.acted), tapAction(pointer));
          }
          return new Output(idle(state.acted));
        }
        break;
    }
    return null;
  }

  function tapAction(pointer: Phaser.Input.Pointer) {
    if (
      pointer.x >= layout.hold.left.pixelLow &&
      pointer.x <= layout.hold.right.pixelHigh &&
      pointer.y >= layout.hold.top.pixelLow &&
      pointer.y <= layout.hold.bottom.pixelHigh
    ) {
      return "hold";
    }
    return pointer.x <
      layout.matrix.left.pixelLow + layout.matrix.width.pixelHigh / 2
      ? "rotateCCW"
      : "rotateCW";
  }
}

export class TouchControlsPlugin extends Phaser.Scenes.ScenePlugin {
  private state = States.idle();
  action: config.Action | null = null;
  pointerJustUp: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene);
    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      this.pointerJustUp = true;
    });

    const eventEmitter = this.systems.events;
    eventEmitter.on("update", this.update, this);
  }

  update(time: number, delta: number) {
    const result = States.transition(
      this.state,
      this.scene.input.activePointer,
      this.pointerJustUp
    );
    this.pointerJustUp = false;
    if (result !== null) {
      this.state = result.state;
      this.action = result.action;
    } else {
      this.action = null;
    }
  }

  get movement(): -1 | 0 | 1 {
    if (this.action === "left") {
      return -1;
    }
    if (this.action === "right") {
      return 1;
    }
    return 0;
  }
}
