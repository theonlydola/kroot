// Shared types for online room multiplayer

export type RoomStatus = "waiting" | "playing" | "finished";

export type RoomPlayer = {
  id: string;
  name: string;
  connected: boolean;
  icon_index: number;
};

export type ImposterGameConfig = {
  category: "food" | "animals" | "objects";
  roundMinutes: number;
  maxPlayers: number;
};

export type ImposterOnlineState = {
  phase:
    | "lobby"
    | "dealing"
    | "timer"
    | "voting"
    | "reveal"
    | "imposter-guess"
    | "results";
  round: number;
  word: string;
  imposterIndex: number;
  timerEnd: number;
  votes: Record<string, number>; // playerId -> votedForIndex
  readyPlayers: string[]; // playerIds who have seen their card
  scores: number[]; // indexed by player position
  imposterGuessResult: boolean | null;
  imposterGuessOptions: string[];
};

// ─── Bad People Online Types ─────────────────────────────────────
export type BadPeopleGameConfig = {
  maxPlayers: number;
};

export type BadPeopleOnlineState = {
  phase: "lobby" | "master-vote" | "player-vote" | "round-results" | "results";
  round: number;
  masterIndex: number;
  questionIndex: number;
  shuffledQuestions: number[]; // indices into the questions array
  masterVote: number; // index of player master voted for (-1 = not yet)
  votes: Record<string, number>; // playerId -> votedForIndex
  currentVoterIndex: number; // index in players array of whose turn it is
  scores: number[]; // indexed by player position
};

export type GameConfig = ImposterGameConfig | BadPeopleGameConfig;
export type GameState = ImposterOnlineState | BadPeopleOnlineState;

export type Room<TConfig = GameConfig, TState = GameState> = {
  id: string;
  code: string;
  slug: string;
  host_id: string;
  status: RoomStatus;
  game_config: TConfig;
  game_state: TState;
  players: RoomPlayer[];
  created_at: string;
  expires_at: string;
};

// Broadcast event types
export type ImposterBroadcastEvent =
  | { type: "game:start"; state: ImposterOnlineState; players: RoomPlayer[] }
  | { type: "game:phase"; state: ImposterOnlineState }
  | { type: "player:ready"; playerId: string }
  | { type: "player:vote"; playerId: string; voteCount: number }
  | { type: "game:reveal"; state: ImposterOnlineState }
  | { type: "imposter:guess"; result: boolean; state: ImposterOnlineState }
  | { type: "game:scores"; state: ImposterOnlineState }
  | { type: "game:next-round"; state: ImposterOnlineState }
  | { type: "game:over"; state: ImposterOnlineState }
  | { type: "player:joined"; player: RoomPlayer; players: RoomPlayer[] }
  | { type: "player:left"; playerId: string; players: RoomPlayer[] }
  | { type: "player:kicked"; playerId: string };

export type BadPeopleBroadcastEvent =
  | { type: "game:start"; state: BadPeopleOnlineState; players: RoomPlayer[] }
  | { type: "game:phase"; state: BadPeopleOnlineState }
  | { type: "game:master-vote"; state: BadPeopleOnlineState }
  | { type: "player:vote"; playerId: string; state: BadPeopleOnlineState }
  | { type: "game:round-results"; state: BadPeopleOnlineState }
  | { type: "game:next-round"; state: BadPeopleOnlineState }
  | { type: "game:over"; state: BadPeopleOnlineState }
  | { type: "player:joined"; player: RoomPlayer; players: RoomPlayer[] }
  | { type: "player:left"; playerId: string; players: RoomPlayer[] }
  | { type: "player:kicked"; playerId: string };

export type BroadcastEvent = ImposterBroadcastEvent | BadPeopleBroadcastEvent;
