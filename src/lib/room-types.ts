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

export type Room = {
  id: string;
  code: string;
  slug: string;
  host_id: string;
  status: RoomStatus;
  game_config: ImposterGameConfig;
  game_state: ImposterOnlineState;
  players: RoomPlayer[];
  created_at: string;
  expires_at: string;
};

// Broadcast event types
export type BroadcastEvent =
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
