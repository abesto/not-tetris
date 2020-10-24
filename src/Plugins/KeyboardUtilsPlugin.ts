import * as Phaser from "phaser";

export class KeyboardUtilsPlugin extends Phaser.Scenes.ScenePlugin {
  anyJustDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    for (let key of keys) {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        return true;
      }
    }
    return false;
  }

  anyJustUp(keys: Phaser.Input.Keyboard.Key[]): boolean {
    for (let key of keys) {
      if (Phaser.Input.Keyboard.JustUp(key)) {
        return true;
      }
    }
    return false;
  }

  anyDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    for (let key of keys) {
      if (key.isDown) {
        return true;
      }
    }
    return false;
  }

  addKeys(keys: number[]): Phaser.Input.Keyboard.Key[] {
    return keys.map((key) => this.scene.input.keyboard.addKey(key));
  }
}
