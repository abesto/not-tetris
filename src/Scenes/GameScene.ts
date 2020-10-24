import * as Phaser from "phaser";

import { LeaderboardPlugin, Timer } from "../Plugins";
import {
  Matrix,
  Tetromino,
  ExtendedPlacementLock,
  Scoring,
  LockOut,
} from "../Model";
import * as config from "../config";
import { layout } from "../Layout";
import { formatTime } from "../utils";

type Command = "softDrop" | "hardDrop" | "rotateCW" | "rotateCCW" | "hold";
type NextTetrominoSource = "random" | "hold";
type Phase = (time: number, delta: number) => Phase;

class BlockOut extends Error {}

class GameData {
  scoring: Scoring = new Scoring();
  placementLock: ExtendedPlacementLock = new ExtendedPlacementLock();
  matrix: Matrix = new Matrix();
  nextQueue: Tetromino[] = [];
  hold: Tetromino | null = null;

  heldThisTetromino: boolean = false;
  gameTime: number = 0;
  flashLeft: number = 0;

  fallTimer: Timer;
  fallSpeed: number;

  tetrominoInPlayModel: Tetromino | null = null;
  ghostModel: Tetromino | null = null;

  constructor() {
    this.updateFallSpeed();
  }

  updateFallSpeed() {
    // 2009 Tetris Design Guideline, 7. Fall & Drop Speeds
    // * 1000 for milliseconds
    this.fallSpeed =
      (0.8 - (this.scoring.level - 1) * 0.007) ** (this.scoring.level - 1) *
      1000;
  }

  get softDropSpeed() {
    return this.fallSpeed / 20;
  }

  shiftNextQueue(): Tetromino {
    this.tetrominoInPlayModel = this.nextQueue.shift()!;
    return this.tetrominoInPlayModel;
  }

  unhold(): Tetromino {
    this.tetrominoInPlayModel = this.hold!;
    this.hold = null;
    return this.tetrominoInPlayModel;
  }
}

export class GameScene extends Phaser.Scene {
  flash: Phaser.GameObjects.Text;
  tetrominoInPlayGameObject: Phaser.GameObjects.Group | null;
  holdGameObject: Phaser.GameObjects.Group | null;
  ghostGameObject: Phaser.GameObjects.Group;
  decorations: Phaser.GameObjects.Group;
  scoreGameObject: Phaser.GameObjects.Text;
  keys: Record<Command, Phaser.Input.Keyboard.Key[]>;

  gameData: GameData;
  phase: Phase | null;

  //////////////////////
  // Phaser interface //
  //////////////////////

  // noinspection JSUnusedGlobalSymbols
  preload() {
    // TODO there should be a better way
    this.tetrominoData.preload();
  }

  // noinspection JSUnusedGlobalSymbols
  create() {
    // Game data
    this.gameData = new GameData();
    this.gameData.fallTimer = this.timer.addTimer(
      "fall",
      this.gameData.fallSpeed
    );
    // TODO there should be a better way to initialize a plugin
    this.tetrominoData.preCreate();
    this.randomGeneration.reset();

    // UI elements
    this.createDecorations();
    this.createScore();
    this.createFlash();
    this.createKeys();
    this.updateNextQueue();

    // Cleanup when leaving the scene
    this.events.on("shutdown", this.shutdown, this);

    // Off we go!
    this.phase = this.generationPhase;
  }

  update(time: number, delta: number) {
    super.update(time, delta);
    this.gameData.gameTime += delta;
    this.logLag(time, delta);

    try {
      if (this.phase) {
        this.phase = this.phase(time, delta);
        this.updateScore();
        this.updateFlash(delta);
      }
    } catch (e) {
      if (e instanceof LockOut || e instanceof BlockOut) {
        this.phase = null;
        this.submitScore().then(() => {
          this.scene.transition({ target: "leaderboard", duration: 0 });
        });
      } else {
        throw e;
      }
    }
  }

  /////////////////////////////////////
  // (extended) Tetris Engine phases //
  /////////////////////////////////////

  generationPhase(time: number, delta: number): Phase {
    this.nextTetromino("random");
    return this.fallingPhase;
  }

  fallingPhase(time: number, delta: number): Phase {
    const maybeNextPhase = this.handleInput(time, delta, false);
    if (maybeNextPhase) {
      return maybeNextPhase;
    }
    if (this.gameData.fallTimer.isFiring) {
      this.fallNow();
    }
    return this.lockPhase(time, delta, false);
  }

  lockPhase(time: number, delta: number, handleInputs: boolean = true): Phase {
    if (this.isLanded()) {
      this.gameData.placementLock.timePassed(delta);
      // "top" is "minY", which is what we want here
      this.gameData.placementLock.landed(
        this.gameData.tetrominoInPlayModel!.bounds.top
      );
      if (this.gameData.placementLock.shouldLock()) {
        this.lock();
        return this.patternPhase;
      }

      if (handleInputs) {
        return this.handleInput(time, delta, true) || this.lockPhase;
      }
      return this.lockPhase;
    } else {
      return this.fallingPhase;
    }
  }

  patternPhase(time: number, delta: number): Phase {
    this.clearFilledRows();
    return this.generationPhase;
  }

  /////////////
  // Helpers //
  /////////////
  get leaderboard(): LeaderboardPlugin {
    return <LeaderboardPlugin>this.plugins.get("LeaderboardPlugin");
  }

  async submitScore() {
    const name = window
      .prompt(
        "Enter (nick)name for submitting to leaderboard\n\n(Yes, really a browser prompt, sorry not sorry)"
      )
      ?.slice(0, config.leaderboardNameLimit);
    if (!name) {
      if (
        window.confirm("Are you sure you do not want to submit your score?")
      ) {
        return;
      } else {
        return await this.submitScore();
      }
    }
    try {
      await this.leaderboard.submit(
        name,
        this.gameData.gameTime,
        this.gameData.scoring
      );
    } catch (e) {
      console.error(e);
      if (
        window.confirm(
          "Failed to submit score :(\nDo you want me to try again?"
        )
      ) {
        return await this.submitScore();
      }
    }
  }

  handleInput(
    time: number,
    delta: number,
    notifyPlacementLock: boolean
  ): Phase | null {
    if (this.handleMoveInput(time, delta)) {
      if (notifyPlacementLock) {
        this.gameData.placementLock.moved();
      }
      this.updateGhost();
    }

    this.handleSoftDropInput();

    if (this.handleRotateInput()) {
      if (notifyPlacementLock) {
        this.gameData.placementLock.rotated();
      }
      this.updateGhost();
    }

    if (this.handleHoldInput()) {
      this.gameData.fallTimer.reset();
      return this.fallingPhase;
    }

    if (this.handleHardDropInput()) {
      return this.patternPhase;
    }

    return null;
  }

  nextTetromino(source: NextTetrominoSource = "random") {
    let tetromino;
    switch (source) {
      case "random":
        tetromino = this.gameData.shiftNextQueue();
        this.updateNextQueue();
        if (this.tetrominoInPlayGameObject) {
          throw new Error("tetrominoInPlayGameObject already exists o.0");
        }
        this.tetrominoInPlayGameObject = this.add.tetromino(tetromino);
        break;
      case "hold":
        tetromino = this.gameData.unhold();
        this.tetrominoInPlayGameObject = this.holdGameObject;
        this.holdGameObject = null;
        break;
    }

    const bounds = tetromino.bounds;
    const [x, y] = [
      Math.ceil((config.columns - bounds.width) / 2),
      config.visibleRows + 1,
    ];
    tetromino.moveBottomLeftTo(x, y);

    if (!tetromino.isValid()) {
      throw new BlockOut();
    }

    const ghost = tetromino.clone();
    this.gameData.ghostModel = ghost;
    this.updateGhost();
    this.ghostGameObject?.destroy(true);
    this.ghostGameObject = this.add.tetromino(ghost);
    this.ghostGameObject.setAlpha(config.dropGhostAlpha);

    this.gameData.fallTimer.reset();
    this.fallNow();
  }

  updateGhost() {
    this.gameData.ghostModel?.ape(this.gameData.tetrominoInPlayModel!);
    while (this.gameData.ghostModel?.canMoveBy(0, -1)) {
      this.gameData.ghostModel.moveBy(0, -1);
    }
  }

  updateNextQueue() {
    const queueLengthBeforeFetch = this.gameData.nextQueue.length;
    const toFetch = config.nextQueueLength - queueLengthBeforeFetch;

    const nextShapes = this.randomGeneration.shiftMany(toFetch);

    this.gameData.nextQueue.push(
      ...nextShapes.map((shape) =>
        this.gameData.matrix.tetromino(this.tetrominoData.getData(shape))
      )
    );

    const next = this.gameData.nextQueue[0];
    const bounds = next.bounds;
    const targetBottomLeft = layout
      .rectRaw(bounds.left, bounds.top, bounds.right, bounds.bottom)
      .centerWithin(layout.next)
      .bottomLeft.intoMatrix();
    next.moveBottomLeftTo(targetBottomLeft.x.mino, targetBottomLeft.y.mino);

    const queue = this.gameData.nextQueue.slice(1);
    const sumQueueHeight = queue.reduce(
      (acc, model) => acc + model.bounds.height,
      0
    );
    const spaceCount = queue.length + 1; // n-1 between, 2 around
    const space = (layout.nextQueue.height.mino - sumQueueHeight) / spaceCount;
    let top = space;
    for (let model of queue) {
      const bounds = model.bounds;
      const targetBottomLeft = layout.nextQueue.topLeft
        .plusRaw(
          (layout.nextQueue.width.mino - bounds.width) / 2,
          top + bounds.height
        )
        .intoMatrix();
      model.moveBottomLeftTo(targetBottomLeft.x.mino, targetBottomLeft.y.mino);
      top += bounds.height + space;
    }

    for (let i = queueLengthBeforeFetch; i < config.nextQueueLength; i++) {
      this.add.tetromino(this.gameData.nextQueue[i]);
    }
  }

  createDecorations() {
    this.decorations = this.add.group();
    const gray = new Phaser.Display.Color().gray(100);

    const background = this.add.myGraphics();
    this.decorations.add(background);

    // Gray background
    background
      .fillStyle(0xaaaaaa)
      .fillRect(0, 0, layout.right.pixelHigh, layout.bottom.pixelHigh);

    // Matrix borders and background
    background
      .outlineWithMinos(gray, layout.matrixBorder)
      .fillStyle(0x000000)
      .fillRectShape(layout.matrix.toPhaserPixel());

    // Background and border for next queue
    background
      .fillStyle(0x000000)
      .lineStyle(10, gray.color)
      .fillRectShape(layout.nextQueue.toPhaserPixel())
      .strokeRectShape(layout.nextQueue.toPhaserPixel());

    // Next piece background and border
    background
      .outlineWithMinos(gray, layout.nextBorder)
      .fillStyle(0x000000)
      .fillRectShape(layout.next.toPhaserPixel());

    // Background and border for hold box
    background
      .outlineWithMinos(gray, layout.holdBorder)
      .fillStyle(0x000000)
      .fillRectShape(layout.hold.toPhaserPixel());
  }

  createKeys() {
    this.keys = {
      softDrop: [],
      hardDrop: [],
      rotateCW: [],
      rotateCCW: [],
      hold: [],
    };
    Object.keys(this.keys).forEach((command) => {
      this.keys[command] = this.keyboardUtils.addKeys(config.keymap[command]);
    });
  }

  createScore() {
    this.scoreGameObject = this.add
      .text(
        layout.holdBorder.left.pixelHigh,
        layout.holdBorder.bottom.pixelHigh + layout.cellSize,
        []
      )
      .setColor("black")
      .setFontSize(30);
    // TODO figure out scaling of the text for different display sizes
    // (everything else correctly changes size on startup to fit the screen)
    // maybe using rexUI
  }

  createFlash() {
    this.flash = this.add
      .text(0, 0, [])
      .setColor("red")
      .setFontStyle("bold")
      .setFontSize(30);
  }

  updateFlash(delta: number) {
    if (this.gameData.flashLeft <= 0) {
      return;
    }
    this.gameData.flashLeft -= delta;
    if (this.gameData.flashLeft <= 0) {
      this.flash.setText("");
    }
  }

  doFlash(message: string[]) {
    this.flash.setText(message);
    this.flash.setPosition(
      this.scoreGameObject.x,
      this.scoreGameObject.y +
        this.scoreGameObject.displayHeight +
        layout.cellSize
    );
    this.gameData.flashLeft = config.flashLength;
  }

  get formattedGameTime(): string {
    return formatTime(this.gameData.gameTime);
  }

  perMinute(n: number): number {
    return (60000 / this.gameData.gameTime) * n;
  }

  updateScore() {
    const scoring = this.gameData.scoring;
    this.scoreGameObject.setText([
      `Score:`,
      `  ${scoring.score}`,
      `Time:`,
      `  ${this.formattedGameTime}`,
      "",
      `Lines:    ${scoring.linesCleared.toFixed(0).padStart(2, "0")}`,
      `Level:    ${scoring.level}`,
      `Goal:     ${scoring.goal}`,
      "",
      `Tetrises: ${scoring.tetrises.toString().padStart(2, "0")}`,
      `Combos:   ${scoring.combos.toString().padStart(2, "0")}`,
      `TPM:      ${this.perMinute(scoring.tetrises)
        .toFixed(0)
        .padStart(2, "0")}`,
      `LPM:      ${this.perMinute(scoring.linesCleared)
        .toFixed(0)
        .padStart(2, "0")}`,
    ]);
  }

  clearFilledRows() {
    let clearedLines = 0;
    for (let row = 1; row <= this.gameData.matrix.rows; row++) {
      while (this.gameData.matrix.isRowFilled(row)) {
        this.gameData.matrix.clearRow(row);
        this.gameData.matrix.shiftDown(row + 1);
        clearedLines += 1;
      }
    }

    if (clearedLines > 0) {
      this.doFlash(this.gameData.scoring.cleared(clearedLines));
      this.gameData.updateFallSpeed();
    }
  }

  logLag(time: number, delta: number) {
    if (delta > config.frameTime) {
      console.warn("Lag, frame time:", delta);
    }
  }

  handleMoveInput(time: number, delta: number): boolean {
    this.tetrisMovement.update(time, delta);
    const movement = this.tetrisMovement.movement;
    if (
      movement !== 0 &&
      this.gameData.tetrominoInPlayModel!.canMoveBy(movement, 0)
    ) {
      this.gameData.tetrominoInPlayModel!.moveBy(movement, 0);
      return true;
    }
    return false;
  }

  handleSoftDropInput() {
    if (this.keyboardUtils.anyDown(this.keys.softDrop)) {
      this.gameData.fallTimer.setInterval(this.gameData.softDropSpeed, true);
    } else {
      this.gameData.fallTimer.setInterval(this.gameData.fallSpeed);
    }
  }

  handleHardDropInput(): boolean {
    if (this.keyboardUtils.anyJustDown(this.keys.hardDrop)) {
      let linesDropped = 0;
      while (this.gameData.tetrominoInPlayModel!.canMoveBy(0, -1)) {
        this.gameData.tetrominoInPlayModel!.moveBy(0, -1);
        linesDropped += 1;
      }
      this.lock();
      this.gameData.scoring.hardDrop(linesDropped);
      return true;
    }
    return false;
  }

  isLanded(): boolean {
    return !this.gameData.tetrominoInPlayModel!.canMoveBy(0, -1);
  }

  lock() {
    this.tetrominoInPlayGameObject?.destroy(false);
    this.tetrominoInPlayGameObject = null;
    this.gameData.matrix.lock(this.gameData.tetrominoInPlayModel!);
    this.gameData.placementLock.locked();
    this.gameData.heldThisTetromino = false;
  }

  fallNow() {
    if (!this.isLanded()) {
      this.gameData.tetrominoInPlayModel!.moveBy(0, -1);
      if (this.keyboardUtils.anyDown(this.keys.softDrop)) {
        this.gameData.scoring.softDrop();
      }
    }
  }

  handleRotateInput(): boolean {
    if (this.keyboardUtils.anyJustDown(this.keys.rotateCW)) {
      return this.gameData.tetrominoInPlayModel!.rotate(1);
    } else if (this.keyboardUtils.anyJustDown(this.keys.rotateCCW)) {
      return this.gameData.tetrominoInPlayModel!.rotate(-1);
    }
    return false;
  }

  handleHoldInput(): boolean {
    if (!this.keyboardUtils.anyJustDown(this.keys.hold)) {
      return false;
    }

    if (this.gameData.heldThisTetromino) {
      return false;
    }

    const toHold = this.gameData.tetrominoInPlayModel!;
    this.holdGameObject = this.tetrominoInPlayGameObject;
    this.tetrominoInPlayGameObject = null;
    if (this.gameData.hold !== null) {
      this.nextTetromino("hold");
    } else {
      this.nextTetromino("random");
    }

    this.gameData.hold = toHold;
    toHold.resetRotation();
    const bounds = toHold.bounds;
    const targetBottomLeft = layout
      .rectRaw(bounds.left, bounds.top, bounds.right, bounds.bottom)
      .centerWithin(layout.hold)
      .bottomLeft.intoMatrix();
    toHold.moveBottomLeftTo(targetBottomLeft.x.mino, targetBottomLeft.y.mino);

    this.gameData.heldThisTetromino = true;

    return true;
  }

  destroy() {
    this.tetrominoInPlayGameObject?.destroy(true);
    Object.values(this.keys).forEach((keys) =>
      keys.forEach((key) => key.destroy())
    );
    this.decorations.destroy(true);
    this.scoreGameObject.destroy();
  }

  shutdown() {
    this.gameData.tetrominoInPlayModel?.destroy();
    this.tetrominoInPlayGameObject?.destroy(true);
    this.tetrominoInPlayGameObject = null;

    this.gameData.hold?.destroy();
    this.holdGameObject?.destroy(true);
    this.holdGameObject = null;

    this.gameData.nextQueue.forEach((model) => model.destroy());
    this.gameData.matrix.clear();

    this.gameData.ghostModel?.destroy();
    this.ghostGameObject.destroy();

    this.flash.setText("");
  }
}
