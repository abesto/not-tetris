import * as Phaser from "phaser";

import * as config from "./config";
import {
  MinoGameObjectPlugin,
  MyGraphicsGameObjectPlugin,
  TetrominoGameObjectPlugin,
} from "./MyGameObjects";
import {
  TetrisMovementPlugin,
  TetrominoDataPlugin,
  TimerPlugin,
  RandomGenerationPlugin,
  KeyboardUtilsPlugin,
  LeaderboardPlugin,
} from "./Plugins";
import { DebugScene, GameScene, LeaderboardScene, MenuScene } from "./Scenes";
import { layout } from "./Layout";

function createGame(): Phaser.Game {
  const game = new Phaser.Game({
    fps: {
      target: config.fps,
    },
    width: layout.right.pixelHigh,
    height: layout.bottom.pixelHigh,
    type: Phaser.AUTO,
    plugins: {
      global: [
        {
          key: "MinoGameObjectPlugin",
          plugin: MinoGameObjectPlugin,
          start: true,
        },
        {
          key: "TetrominoGameObjectPlugin",
          plugin: TetrominoGameObjectPlugin,
          start: true,
        },
        {
          key: "MyGraphicsGameObjectPlugin",
          plugin: MyGraphicsGameObjectPlugin,
          start: true,
        },
        {
          key: "LeaderboardPlugin",
          plugin: LeaderboardPlugin,
        },
      ],
      scene: [
        {
          key: "KeyboardUtilsPlugin",
          plugin: KeyboardUtilsPlugin,
          start: true,
          mapping: "keyboardUtils",
        },
        {
          key: "TetrisMovementPlugin",
          plugin: TetrisMovementPlugin,
          start: true,
          mapping: "tetrisMovement",
        },
        {
          key: "TetrominoDataPlugin",
          plugin: TetrominoDataPlugin,
          start: true,
          mapping: "tetrominoData",
        },
        {
          key: "TimerPlugin",
          plugin: TimerPlugin,
          start: true,
          mapping: "timer",
        },
        {
          key: "RandomGenerationPlugin",
          plugin: RandomGenerationPlugin,
          start: true,
          mapping: "randomGeneration",
        },
      ],
    },
  });

  game.scene.add("menu", MenuScene, true);
  game.scene.add("game", GameScene);
  game.scene.add("leaderboard", LeaderboardScene);
  game.scene.add("debug", DebugScene);
  // TODO create a BootScene with loader animation / text

  return game;
}

window.onload = () => {
  createGame();
};
