import { createGame, getGame } from "../game.service";
import { Game, Player, SetupType } from "../../models";
import {
  enterPlayersChooseState,
  enterHostChoosesState,
  playerChoosePunchlines,
} from "../round.service";
import mongoose from "mongoose";
import { RoundState } from "../../models/round.model";
import { createPlayer } from "../player.service";

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("enterPlayersChooseState Service", () => {
  let game: Game;

  beforeEach(async () => {
    const gameCode = await createGame();
    game = await getGame(gameCode);

    game.rounds.push({
      setup: {
        setup: "Why did the chicken cross the road?",
        type: SetupType.pickOne,
      },
      host: "abc123",
    });
  });

  it("enters playersChoose state", async () => {
    await game.save();

    await enterPlayersChooseState(game.gameCode, "abc123");

    game = await getGame(game.gameCode);
    expect(game.rounds[0].state).toBe(RoundState.playersChoose);
  });

  it("throws error if game contains no rounds", async () => {
    game.rounds.pop();
    await game.save();

    await expect(
      enterPlayersChooseState(game.gameCode, "abc123")
    ).rejects.toThrow("Cannot begin round");
  });

  it("throws error if round state is not BEFORE", async () => {
    game.rounds[0].state = RoundState.playersChoose;
    await game.save();

    await expect(
      enterPlayersChooseState(game.gameCode, "abc123")
    ).rejects.toThrow("Cannot begin round");
  });

  it("throws error if player is not the round host", async () => {
    game.rounds[0].host = "abcd1234";
    await game.save();

    await expect(
      enterPlayersChooseState(game.gameCode, "abc123")
    ).rejects.toThrow("Cannot begin round");
  });
});

describe("playersChoosePunchline Service", () => {
  let gameCode: string;
  let game: Game;
  let playerId: Player["id"];

  beforeEach(async () => {
    gameCode = await createGame();
    playerId = await createPlayer(gameCode, "Bob");

    game = await getGame(gameCode);
    game.rounds.push({
      setup: {
        setup: "Why did the chicken cross the road?",
        type: SetupType.pickOne,
      },
      host: "abc123",
      state: RoundState.playersChoose,
    });
    const player = game.players.id(playerId);
    if (player !== null) {
      player.punchlines = [
        "To get to the other side",
        "To avoid bad jokes",
        "To go to KFC",
        "To go to Cheeky Nando's with the lads",
      ];
    }
  });

  it("chooses players cards for the round, removes cards from the players hand and add them to game discard pile", async () => {
    await game.save();

    await playerChoosePunchlines(gameCode, playerId, [
      "To get to the other side",
    ]);

    game = await getGame(gameCode);

    expect(game.players[0]).toEqual(
      expect.not.arrayContaining(["To get to the other side"])
    );
    expect(game.rounds[0].punchlinesByPlayer.get(playerId)).toBe(
      '["To get to the other side"]'
    );
    expect(game.discardedPunchlines).toEqual(
      expect.arrayContaining(["To get to the other side"])
    );
  });

  it("handles multiple players choosing cards", async () => {
    await game.save();

    const player2Id = await createPlayer(gameCode, "Fred");
    game = await getGame(gameCode);
    const player2 = game.players.id(player2Id);
    if (player2 !== null) {
      player2.punchlines = [
        "To prove it wasn't chicken!",
        "It was feeling cocky",
      ];
    }
    await game.save();

    await playerChoosePunchlines(gameCode, playerId, [
      "To get to the other side",
    ]);
    await playerChoosePunchlines(gameCode, player2Id, ["It was feeling cocky"]);

    game = await getGame(gameCode);

    expect(game.players[1]).toEqual(
      expect.not.arrayContaining(["It was feeling cocky"])
    );
    expect(game.rounds[0].punchlinesByPlayer.get(player2Id)).toBe(
      '["It was feeling cocky"]'
    );
    expect(game.discardedPunchlines).toEqual(
      expect.arrayContaining([
        "To get to the other side",
        "It was feeling cocky",
      ])
    );
  });

  it("throws error if game contains no rounds", async () => {
    game.rounds.pop();
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, playerId, ["To get to the other side"])
    ).rejects.toThrow("Cannot choose punchlines");
  });

  it("throws error if round state is not PLAYERS_CHOSE", async () => {
    game.rounds[0].state = RoundState.before;
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, playerId, ["To get to the other side"])
    ).rejects.toThrow("Cannot choose punchlines");
  });

  it("throws error if player is the round host", async () => {
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, "abc123", ["To get to the other side"])
    ).rejects.toThrow("Cannot choose punchlines");
  });

  it("throws error if player has already chosen punchlines for this round", async () => {
    game.rounds[0].punchlinesByPlayer.set(
      playerId,
      '["To get to the other side"]'
    );
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, playerId, ["To get to the other side"])
    ).rejects.toThrow("Cannot choose punchlines");
  });

  it("throws error if one punchline isn't provided for PICK_ONE round setup", async () => {
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, playerId, [
        "To get to the other side",
        "To avoid bad jokes",
      ])
    ).rejects.toThrow("Cannot choose punchlines");
  });

  it("throws error if two punchlines aren't provided for PICK_TWO round setup", async () => {
    game.rounds[0].setup.type = SetupType.pickTwo;
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, playerId, [
        "To get to the other side",
        "To avoid bad jokes",
        "To go to KFC",
      ])
    ).rejects.toThrow("Cannot choose punchlines");
  });

  it("throws error if three punchlines aren't provided for DRAW_TWO_PICK_THREE round setup", async () => {
    game.rounds[0].setup.type = SetupType.drawTwoPickThree;
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, playerId, [
        "To get to the other side",
        "To avoid bad jokes",
        "To go to KFC",
        "To go to Cheeky Nando's with the lads",
      ])
    ).rejects.toThrow("Cannot choose punchlines");
  });

  it("throws error if player does not exist in game", async () => {
    game.players.pop();
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, playerId, ["To get to the other side"])
    ).rejects.toThrow("Cannot choose punchlines");
  });

  it("throws error if player chooses punchline that is not in their hand", async () => {
    await game.save();

    await expect(
      playerChoosePunchlines(gameCode, playerId, [
        "To try out their black market jokes",
      ])
    ).rejects.toThrow("Cannot choose punchlines");
  });
});

describe("enterHostChoosesState Service", () => {
  let game: Game;

  beforeEach(async () => {
    const gameCode = await createGame();
    game = await getGame(gameCode);

    game.rounds.push({
      setup: {
        setup: "Why did the chicken cross the road?",
        type: SetupType.pickOne,
      },
      host: "abc123",
      state: RoundState.playersChoose,
      punchlinesByPlayer: new Map([
        ["abc123", '["To get to the other side"]'],
        ["def456", '["It was feeling cocky"]'],
      ]),
    });
  });

  it("enters hostChooses state", async () => {
    await game.save();

    const punchlines = await enterHostChoosesState(game.gameCode, "abc123");

    game = await getGame(game.gameCode);
    expect(game.rounds[0].state).toBe(RoundState.hostChooses);
    expect(punchlines).toMatchObject([
      ["To get to the other side"],
      ["It was feeling cocky"],
    ]);
  });

  it("throws error if game contains no rounds", async () => {
    game.rounds.pop();
    await game.save();

    await expect(
      enterHostChoosesState(game.gameCode, "abc123")
    ).rejects.toThrow("Cannot enter state");
  });

  it("throws error if round state is not PLAYERS_CHOOSE", async () => {
    game.rounds[0].state = RoundState.before;
    await game.save();

    await expect(
      enterHostChoosesState(game.gameCode, "abc123")
    ).rejects.toThrow("Cannot enter state");
  });

  it("throws error if player is not the round host", async () => {
    game.rounds[0].host = "abcd1234";
    await game.save();

    await expect(
      enterHostChoosesState(game.gameCode, "abc123")
    ).rejects.toThrow("Cannot enter state");
  });
});
