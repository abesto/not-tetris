import * as Phaser from "phaser";
import { layout } from "../Layout";

type Command = "down" | "up" | "accept";

export class MenuScene extends Phaser.Scene {
  private menuItems = [
    { label: "Start New Game", target: "game" },
    { label: "View Leaderboard", target: "leaderboard" },
  ];
  private previousMenu: number;
  private activeMenu: number;
  private menuObjects: Phaser.GameObjects.Text[];
  private titleObject: Phaser.GameObjects.Text;
  private controlsObject: Phaser.GameObjects.Text;

  private keys: Record<Command, Phaser.Input.Keyboard.Key>;

  createLegal() {
    const legal = this.make
      .text({
        text: [
          "This is NOT a Tetris game. This is a clone of Tetris developed as a hobby project.",
          "It does not even have a name.",
          "",
          "Tetris ® & © 1985~2020 Tetris Holding, LLC.",
          "Tetris logo, Tetris theme song and Tetriminos are trademarks of Tetris Holding, LLC.",
          "Game design by Alexey Pajitnov.",
        ].join("\n"),
      })
      .setAlign("center");
    legal.setPosition(
      (layout.right.pixelHigh - legal.displayWidth) / 2,
      layout.bottom.pixelHigh - legal.displayHeight - 30
    );
    this.add.existing(legal);
  }

  createTitle() {
    this.titleObject = this.make
      .text({ text: "Nameless Tetris® Clone" })
      .setFontSize(50)
      .setFontStyle("bold");
    this.titleObject.setPosition(
      (layout.right.pixelHigh - this.titleObject.displayWidth) / 2,
      layout.bottom.pixelHigh / 10
    );
    this.add.existing(this.titleObject);
  }

  createMenu() {
    this.activeMenu = 0;
    this.previousMenu = 0;
    this.menuObjects = [];

    const maxLabelLength = this.menuItems
      .map((item) => item.label.length)
      .reduce((acc, n) => Math.max(acc, n), -Infinity);

    let y = 0;
    for (let item of this.menuItems) {
      const padding =
        " ".repeat((maxLabelLength - item.label.length) / 2) + "  ";
      const text = this.make
        .text(
          { x: 0, y, text: `${padding}${item.label}${padding}`, fontSize: 15 },
          false
        )
        .setAlign("center");
      y += text.displayHeight;
      this.menuObjects.push(text);
    }

    const xOffset =
      (layout.right.pixelHigh - this.menuObjects[0].displayWidth) / 2;
    const yOffset = this.controlsObject.getBounds().bottom + 50;

    for (let object of this.menuObjects) {
      object.setPosition(xOffset, object.y + yOffset);
    }

    this.updateActiveMenuItem();

    for (let i = 0; i < this.menuObjects.length; i++) {
      const object = this.menuObjects[i];
      this.add.existing(object);
      object.setInteractive();
      object.on("pointerover", () => {
        this.activeMenu = i;
      });
      object.on("pointerdown", () => {
        this.activeMenu = i;
        this.accept();
      });
    }
  }

  create() {
    this.createLegal();
    this.createTitle();
    this.createControls();
    this.createMenu();
    this.createKeys();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      this.activeMenu = (this.activeMenu + 1) % this.menuItems.length;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.activeMenu = (this.activeMenu - 1) % this.menuItems.length;
      if (this.activeMenu < 0) {
        this.activeMenu = this.activeMenu + this.menuItems.length;
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.accept)) {
      this.accept();
    }

    if (this.activeMenu !== this.previousMenu) {
      this.updateActiveMenuItem();
      this.previousMenu = this.activeMenu;
    }
  }

  private accept() {
    this.scene.transition({
      target: this.menuItems[this.activeMenu].target,
      duration: 0,
    });
  }

  private updateActiveMenuItem() {
    for (let i = 0; i < this.menuObjects.length; i++) {
      if (this.activeMenu === i) {
        this.menuObjects[i].setBackgroundColor("green").setFontStyle("bold");
      } else {
        this.menuObjects[i].setBackgroundColor("black").setFontStyle("normal");
      }
    }
  }

  private createKeys() {
    this.keys = {
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      accept: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    };
  }

  private createControls() {
    this.controlsObject = this.add.text(0, 0, [
      "CONTROL        KEYBOARD        NUMPAD    TOUCH",
      "Move left .... Left arrow  ..... 4 ......Drag left",
      "Move right ... Right arrow ..... 6 ......Drag right",
      "Rotate CW .... X, Up arrow ... 1/5/9 ... Tap right side",
      "Rotate CCW ... Z, Y ........... 3/7 .... Tap left side",
      "Hold ..........C ............... 0 ..... Tap hold area",
      "Soft drop .... Down arrow ...... 2 ..... Drag down",
      "Hard drop .... Space ........... 8 ..... Flick down",
    ]);
    this.controlsObject.setPosition(
      (layout.right.pixelHigh - this.controlsObject.displayWidth) / 2,
      this.titleObject.getBounds().bottom + this.titleObject.displayHeight
    );
  }
}
