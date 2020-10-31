import * as Phaser from "phaser";

import { Scoring } from "../Model";
import * as config from "../config";

const firebase = require("firebase/app");
require("firebase/firestore");

export type LeaderboardEntry = {
  name: string;
  time: number;
  score: number;
  level: number;
};
export type Leaderboard = LeaderboardEntry[];

export class LeaderboardPlugin extends Phaser.Plugins.BasePlugin {
  private initialized: Promise<void>;

  constructor(pluginManager: Phaser.Plugins.PluginManager) {
    super(pluginManager);
    this.initialized = fetch("/__/firebase/init.json").then(
      this.initFirebase,
      this.complain
    );
  }

  async initFirebase(initJsonResponse: Response) {
    const firebaseConfig = await initJsonResponse.json();
    firebase.initializeApp(firebaseConfig);
  }

  get collection() {
    return firebase.firestore().collection("leaderboard");
  }

  async load(): Promise<Leaderboard> {
    await this.initialized;
    const snapshot = await this.collection
      .orderBy("score", "desc")
      .limit(config.leaderboardNameLimit)
      .get();
    return snapshot.docs.map((entry) => {
      const data = entry.data();
      return {
        name: entry.id,
        ...data,
      };
    });
  }

  async submit(name: string, gameTime: number, scoring: Scoring) {
    await this.initialized;
    const doc = this.collection.doc(name);

    const oldData = await doc.get();
    if (!oldData.exists || oldData.data().score < scoring.score) {
      await doc.set({
        score: scoring.score,
        level: scoring.level,
        time: gameTime,
      });
    }
  }

  private complain(err) {
    this.initialized = Promise.reject(err);
    alert(
      "Failed to connect to backend, leaderboard listing and submitting will fail. Maybe reload?"
    );
  }
}
