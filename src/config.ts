import * as Phaser from "phaser";

export const fps = 60;
export const frameTime = (1 / fps) * 1000;

export const rows = 40;
export const visibleRows = 20;
export const columns = 10;

// Holding down the move button triggers an Auto-Repeat movement that allows the player to move a Tetrimino from one
// side of the Matrix to the other in about 0.5 seconds
//  - 2009 Tetris Design Guideline
export const autoRepeatRate = columns / 0.5;

// There must be a slight delay between the time the move button is pressed and the time when Auto-Repeat kicks in,
// roughly 0.3 seconds
//  - 2009 Tetris Design Guideline
export const delayedAutoShift = 300;

export const nextQueueLength = 6;
export const nextQueueWidth = 5;
export const nextHeight = 3;

export const holdWidth = 5;
export const holdHeight = 3;

export const skylightRatio = 0.2;

export const dropGhostAlpha = 0.15;
export const lockDarken = 20;
export const minoSideColorStep = 30;

export const flashLength = 2000;

export const leaderboardNameLimit = 30;

// 2009 Tetris Design Guideline, 4.1: Table of Basic Controls
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
export const keymap = {
  left: [KeyCodes.LEFT, KeyCodes.NUMPAD_FOUR],
  right: [KeyCodes.RIGHT, KeyCodes.NUMPAD_SIX],
  hardDrop: [KeyCodes.SPACE, KeyCodes.NUMPAD_EIGHT],
  softDrop: [KeyCodes.DOWN, KeyCodes.NUMPAD_TWO],
  rotateCW: [
    KeyCodes.UP,
    KeyCodes.X,
    KeyCodes.NUMPAD_ONE,
    KeyCodes.NUMPAD_FIVE,
    KeyCodes.NUMPAD_NINE,
  ],
  rotateCCW: [
    // Directly checking for CTRL seems to be unsupported in Phaser, so we skip that binding
    KeyCodes.Z,
    KeyCodes.Y,
    KeyCodes.NUMPAD_THREE,
    KeyCodes.NUMPAD_SEVEN,
  ],
  hold: [
    // Directly checking for Shift seems to be unsupported in Phaser, so we skip that binding
    KeyCodes.C,
    KeyCodes.NUMPAD_ZERO,
  ],
  pause: [KeyCodes.F1, KeyCodes.ESC],
};
