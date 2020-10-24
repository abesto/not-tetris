import * as Phaser from "phaser";
import * as config from "../config";

namespace InputsHeld {
  export enum State {
    None,
    Left,
    Right,
    LeftThenRight,
    RightThenLeft,
  }

  export enum Input {
    LeftDown,
    RightDown,
    LeftUp,
    RightUp,
  }

  const transitions = {
    [State.None]: {
      [Input.LeftDown]: State.Left,
      [Input.RightDown]: State.Right,
    },
    [State.Left]: {
      [Input.RightDown]: State.LeftThenRight,
      [Input.LeftUp]: State.None,
    },
    [State.Right]: {
      [Input.LeftDown]: State.RightThenLeft,
      [Input.RightUp]: State.None,
    },
    [State.LeftThenRight]: {
      [Input.LeftUp]: State.Right,
      [Input.RightUp]: State.Left,
    },
  };
  transitions[State.RightThenLeft] = transitions[State.LeftThenRight];

  export function transition(state: State, input: Input): State {
    if (!(input in transitions[state])) {
      throw new Error(`Invalid transition: from ${state} via ${input}`);
    }
    return transitions[state][input];
  }
}

type Movement = -1 | 0 | 1;

function inputsHeldToMovement(held: InputsHeld.State): Movement {
  switch (held) {
    case InputsHeld.State.Left:
    case InputsHeld.State.RightThenLeft:
      return -1;
    case InputsHeld.State.Right:
    case InputsHeld.State.LeftThenRight:
      return 1;
    case InputsHeld.State.None:
      return 0;
  }
}

namespace MovementState {
  enum MovementStateType {
    None,
    DelayedAutoShift,
    AutoRepeat,
  }

  export type State =
    | { type: MovementStateType.None; inputs: InputsHeld.State.None }
    | {
        type: MovementStateType.DelayedAutoShift;
        inputs: InputsHeld.State;
        deltaSinceStarted: number;
      }
    | {
        type: MovementStateType.AutoRepeat;
        inputs: InputsHeld.State;
        deltaSinceLastRepeat: number;
      };

  export function none(): State {
    return { type: MovementStateType.None, inputs: InputsHeld.State.None };
  }

  function delayedAutoShift(inputs: InputsHeld.State): State {
    return {
      type: MovementStateType.DelayedAutoShift,
      inputs: inputs,
      deltaSinceStarted: 0,
    };
  }

  function autoRepeat(inputs: InputsHeld.State): State {
    return {
      type: MovementStateType.AutoRepeat,
      inputs: inputs,
      deltaSinceLastRepeat: 0,
    };
  }

  type Transition = {
    nextState: State;
    movement: Movement;
  };

  function Transition(nextState: State, movement: Movement): Transition {
    return { nextState, movement };
  }

  export function timePassed(state: State, delta: number): Transition {
    switch (state.type) {
      case MovementStateType.None:
        return Transition(state, 0);

      case MovementStateType.DelayedAutoShift:
        state.deltaSinceStarted += delta;
        if (state.deltaSinceStarted >= config.delayedAutoShift) {
          return Transition(
            autoRepeat(state.inputs),
            inputsHeldToMovement(state.inputs)
          );
        } else {
          return Transition(state, 0);
        }

      case MovementStateType.AutoRepeat:
        state.deltaSinceLastRepeat += delta;
        if (state.deltaSinceLastRepeat >= config.autoRepeatRate) {
          state.deltaSinceLastRepeat = 0;
          return Transition(state, inputsHeldToMovement(state.inputs));
        } else {
          return Transition(state, 0);
        }
    }
  }

  export function input(state: State, input: InputsHeld.Input): Transition {
    const newInputState = InputsHeld.transition(state.inputs, input);
    return Transition(
      delayedAutoShift(newInputState),
      inputsHeldToMovement(newInputState)
    );
  }
}

export class TetrisMovementPlugin extends Phaser.Scenes.ScenePlugin {
  private state: MovementState.State;
  private keys: Record<"left" | "right", Phaser.Input.Keyboard.Key[]>;
  movement: Movement;

  boot() {
    this.state = MovementState.none();
    this.keys = {
      left: this.scene.keyboardUtils.addKeys(config.keymap.left),
      right: this.scene.keyboardUtils.addKeys(config.keymap.right),
    };

    this.systems.events.on("destroy", this.destroy, this);
  }

  update(time: number, delta: number) {
    this.movement = 0;

    if (this.scene.keyboardUtils.anyJustDown(this.keys.left)) {
      this.handleInput(InputsHeld.Input.LeftDown);
    }
    if (this.scene.keyboardUtils.anyJustDown(this.keys.right)) {
      this.handleInput(InputsHeld.Input.RightDown);
    }
    if (this.scene.keyboardUtils.anyJustUp(this.keys.left)) {
      this.handleInput(InputsHeld.Input.LeftUp);
    }
    if (this.scene.keyboardUtils.anyJustUp(this.keys.right)) {
      this.handleInput(InputsHeld.Input.RightUp);
    }

    const transition = MovementState.timePassed(this.state, delta);
    this.state = transition.nextState;
    if (this.movement === 0) {
      this.movement = transition.movement;
    }
  }

  handleInput(input: InputsHeld.Input) {
    const transition = MovementState.input(this.state, input);
    this.state = transition.nextState;
    this.movement = transition.movement;
  }

  destroy() {
    Object.values(this.keys).map((keys) => keys.map((key) => key.destroy()));
  }
}
