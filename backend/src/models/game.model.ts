import mongoose, { Document, ObjectId, Schema } from "mongoose";
import { SetupSchema, Setup } from "./setup.model";
import { SettingsSchema, Settings } from "./settings.model";
import { PlayerSchema, Player } from "./player.model";
import { RoundSchema, Round } from "./round.model";

export enum GameState {
  lobby = "LOBBY",
  roundBefore = "ROUND_BEFORE",
  roundPlayers = "ROUND_PLAYERS_CHOOSE",
  roundHost = "ROUND_HOST_CHOOSE",
  roundAfter = "ROUND_AFTER",
  finished = "FINISHED",
}

export interface Game extends Document {
  gameCode: string;
  settings?: Settings;
  setups: Setup[];
  discardedSetups?: Setup[];
  punchlines: string[];
  discardedPunchlines?: string[];
  players?: Player[];
  host?: ObjectId;
  state?: GameState;
  rounds?: Round[];
}

const GameSchema: Schema = new Schema({
  gameCode: { type: String, required: true, unique: true },
  settings: SettingsSchema,
  setups: {
    type: [SetupSchema],
    validate: (v: Game["setups"]) => Array.isArray(v) && v.length > 0,
  },
  discardedSetups: [SetupSchema],
  punchlines: {
    type: [String],
    validate: (v: Game["punchlines"]) => Array.isArray(v) && v.length > 0,
  },
  discardedPunchlines: [String],
  players: [PlayerSchema],
  host: Schema.Types.ObjectId,
  state: {
    type: String,
    enum: Object.values(GameState),
    default: GameState.lobby,
  },
  rounds: [RoundSchema],
});

export default mongoose.model<Game>("Game", GameSchema);
