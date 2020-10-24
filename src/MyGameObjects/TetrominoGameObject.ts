import * as Phaser from "phaser";
import { Mino, Tetromino } from "../Model";
import { MinoGameObject } from "./MinoGameObject";

export class TetrominoGameObjectPlugin extends Phaser.Plugins.BasePlugin {
  constructor(pluginManager: Phaser.Plugins.PluginManager) {
    super(pluginManager);
    pluginManager.registerGameObject("tetromino", this.createTetromino);
  }

  createTetromino(
    this: Phaser.GameObjects.GameObjectFactory,
    model: Tetromino
  ) {
    return this.group(
      model.minos.map((tile) => {
        return this.mino(tile);
      })
    );
  }
}
