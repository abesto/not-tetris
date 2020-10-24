import * as Phaser from "phaser";

import { Leaderboard, LeaderboardPlugin } from "../Plugins";
import * as config from "../config";
import { layout } from "../Layout";
import { formatTime } from "../utils";

export class LeaderboardScene extends Phaser.Scene {
  text: Phaser.GameObjects.Text;

  get leaderboard(): LeaderboardPlugin {
    return <LeaderboardPlugin>this.plugins.get("LeaderboardPlugin");
  }

  create() {
    this.text = this.add.text(0, 0, "Loading...");
    this.centerText();
    this.leaderboard.load().then(this.displayScores, this.displayError);
    this.input.keyboard.on("keydown", this.leave, this);
    this.input.on("pointerdown", this.leave, this);
  }

  centerText = () => {
    this.text.setPosition(
      (layout.right.pixelHigh - this.text.displayWidth) / 2,
      (layout.bottom.pixelHigh - this.text.displayHeight) / 2
    );
  };

  displayScores = (leaderboard: Leaderboard) => {
    const lines = leaderboard.map((entry) =>
      [
        entry.name
          .slice(0, config.leaderboardNameLimit)
          .padEnd(config.leaderboardNameLimit, " "),
        entry.level.toFixed(0).padStart(2, "0").padStart(10, " "),
        entry.score.toFixed(0).padStart(10, "0").padStart(15, " "),
        formatTime(entry.time).padStart(15, " "),
      ].join("")
    );

    lines.unshift(
      [
        "NAME".padEnd(config.leaderboardNameLimit, " "),
        "LEVEL".padStart(10, " "),
        "SCORE".padStart(15, " "),
        "TIME".padStart(15, " "),
      ].join("")
    );
    this.text.setColor("white").setText(lines);
    this.centerText();
  };

  displayError = (error) => {
    this.text.setText(error.toString()).setColor("red");
    this.centerText();
  };

  leave() {
    this.scene.transition({ target: "menu", duration: 0 });
  }
}
