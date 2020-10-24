declare namespace Phaser {
  interface Scene {
    tetrisMovement: import("./Plugins").TetrisMovementPlugin;
    tetrominoData: import("./Plugins").TetrominoDataPlugin;
    timer: import("./Plugins").TimerPlugin;
    randomGeneration: import("./Plugins").RandomGenerationPlugin;
    keyboardUtils: import("./Plugins").KeyboardUtilsPlugin;
  }
}
