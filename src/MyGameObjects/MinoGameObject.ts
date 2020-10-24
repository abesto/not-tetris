import * as Phaser from "phaser";

import { Mino, MinoEvents } from "../Model";
import { MyGraphicsGameObject } from "./MyGraphicsGameObject";

export class MinoGameObject extends MyGraphicsGameObject {
  private model: Mino;
  private positionDirty: boolean = true;
  private colorDirty: boolean = false;

  constructor(scene: Phaser.Scene, model: Mino) {
    super(scene, model.cell.toSceneTopLeftPixel());
    this.model = model;
    this.draw();
    this.model.on(MinoEvents.Change, () => (this.positionDirty = true));
    this.model.on(MinoEvents.Lock, () => (this.colorDirty = true));
    this.model.on(MinoEvents.Destroy, this.destroy, this);
  }

  private draw() {
    this.drawMino(this.model.color);
  }

  // noinspection JSUnusedGlobalSymbols
  preUpdate() {
    if (this.positionDirty) {
      const scenePoint = this.model.cell.toSceneTopLeftPixel();
      this.setPosition(scenePoint.x, scenePoint.y);
      this.positionDirty = false;
    }
    if (this.colorDirty) {
      this.clear();
      this.draw();
      this.colorDirty = false;
    }
  }
}

export class MinoGameObjectPlugin extends Phaser.Plugins.BasePlugin {
  constructor(pluginManager: Phaser.Plugins.PluginManager) {
    super(pluginManager);
    pluginManager.registerGameObject("mino", this.createMino);
  }

  createMino(this: Phaser.GameObjects.GameObjectFactory, model: Mino) {
    const gameObject = new MinoGameObject(this.scene, model);
    this.displayList.add(gameObject);
    this.updateList.add(gameObject);
    return gameObject;
  }
}
