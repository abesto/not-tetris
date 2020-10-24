declare namespace Phaser.GameObjects {
  interface GameObjectFactory {
    mino(
      model: import("../Model").Mino
    ): import("./MinoGameObject").MinoGameObject;

    myGraphics(): import("./MyGraphicsGameObject").MyGraphicsGameObject;

    tetromino(model: import("../Model").Tetromino): Phaser.GameObjects.Group;
  }
}
