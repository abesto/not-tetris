import * as Phaser from "phaser";
import { layout, Point, Rect } from "../Layout";
import * as config from "../config";

export class MyGraphicsGameObject extends Phaser.GameObjects.Graphics {
  private drawQuad(color: Phaser.Display.Color, ...points: [number, number][]) {
    this.fillStyle(color.color).lineStyle(1, color.color).beginPath();
    this.moveTo(points[0][0], points[0][1]);
    for (let [x, y] of points.slice(1)) {
      this.lineTo(x, y);
    }
    this.closePath().fillPath().strokePath();
  }

  drawMino(color: Phaser.Display.Color, x?: number, y?: number) {
    const outline = new Phaser.Geom.Rectangle(
      (x || 0) * layout.cellSize,
      (y || 0) * layout.cellSize,
      layout.cellSize,
      layout.cellSize
    );
    const inset = new Phaser.Geom.Rectangle(
      outline.x + layout.blockInsetSize,
      outline.y + layout.blockInsetSize,
      layout.cellSize - 2 * layout.blockInsetSize,
      layout.cellSize - 2 * layout.blockInsetSize
    );

    // Inner rectangle
    this.lineStyle(1, color.color)
      .fillStyle(color.color)
      .fillRectShape(inset)
      .strokeRectShape(inset);

    // Top quad
    this.drawQuad(
      color.clone().desaturate(2 * config.minoSideColorStep),
      [outline.left, outline.top],
      [inset.left, inset.top],
      [inset.right, inset.top],
      [outline.right, outline.top]
    );

    // Right quad
    this.drawQuad(
      color.clone().darken(config.minoSideColorStep),
      [outline.right, outline.top],
      [inset.right, inset.top],
      [inset.right, inset.bottom],
      [outline.right, outline.bottom]
    );

    // Bottom quad
    this.drawQuad(
      color.clone().darken(2 * config.minoSideColorStep),
      [outline.left, outline.bottom],
      [inset.left, inset.bottom],
      [inset.right, inset.bottom],
      [outline.right, outline.bottom]
    );

    // Left quad
    this.drawQuad(
      color.clone().desaturate(config.minoSideColorStep),
      [outline.left, outline.top],
      [inset.left, inset.top],
      [inset.left, inset.bottom],
      [outline.left, outline.bottom]
    );

    return this;
  }

  fillWithMinos(
    color: Phaser.Display.Color,
    p1: Point,
    p2: Point
  ): MyGraphicsGameObject {
    for (let x = p1.x.mino; x <= p2.x.mino; x++) {
      for (let y = p1.y.mino; y <= p2.y.mino; y++) {
        this.drawMino(color, x, y);
      }
    }
    return this;
  }

  outlineWithMinos(
    color: Phaser.Display.Color,
    rect: Rect
  ): MyGraphicsGameObject {
    return this.fillWithMinos(color, rect.topLeft, rect.topRight)
      .fillWithMinos(color, rect.topLeft, rect.bottomLeft)
      .fillWithMinos(color, rect.bottomLeft, rect.bottomRight)
      .fillWithMinos(color, rect.topRight, rect.bottomRight);
  }
}

export class MyGraphicsGameObjectPlugin extends Phaser.Plugins.BasePlugin {
  constructor(pluginManager: Phaser.Plugins.PluginManager) {
    super(pluginManager);
    pluginManager.registerGameObject("myGraphics", this.createMyGraphics);
  }

  createMyGraphics(this: Phaser.GameObjects.GameObjectFactory) {
    const gameObject = new MyGraphicsGameObject(this.scene);
    this.displayList.add(gameObject);
    return gameObject;
  }
}
