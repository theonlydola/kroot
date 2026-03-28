"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import type {
  Room,
  RoomPlayer,
  ImposterOnlineState,
  BadPeopleOnlineState,
  GameConfig,
  GameState,
} from "@/lib/room-types";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for clarity
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return crypto.randomUUID();
}

export async function createRoom(
  slug: string,
  hostName: string,
  gameConfig: GameConfig,
): Promise<{ roomId: string; code: string; playerId: string } | { error: string }> {
  const supabase = getSupabaseServerClient();
  const playerId = generatePlayerId();

  // Try up to 5 times to get a unique code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();

    const hostPlayer: RoomPlayer = {
      id: playerId,
      name: hostName,
      connected: true,
      icon_index: 0,
    };

    let initialState: GameState;

    if (slug === "bad-people") {
      initialState = {
        phase: "lobby",
        round: 0,
        masterIndex: 0,
        questionIndex: 0,
        shuffledQuestions: [],
        masterVote: -1,
        votes: {},
        currentVoterIndex: 0,
        scores: [],
      } satisfies BadPeopleOnlineState;
    } else {
      initialState = {
        phase: "lobby",
        round: 0,
        word: "",
        imposterIndex: -1,
        timerEnd: 0,
        votes: {},
        readyPlayers: [],
        scores: [],
        imposterGuessResult: null,
        imposterGuessOptions: [],
      } satisfies ImposterOnlineState;
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        slug,
        host_id: playerId,
        status: "waiting",
        game_config: gameConfig,
        game_state: initialState,
        players: [hostPlayer],
      })
      .select("id, code")
      .single();

    if (error) {
      // Unique constraint violation on code — retry
      if (error.code === "23505") continue;
      return { error: "Failed to create room. Please try again." };
    }

    return { roomId: data.id, code: data.code, playerId };
  }

  return { error: "Failed to generate a unique room code. Please try again." };
}

export async function joinRoom(
  code: string,
  playerName: string,
): Promise<
  { roomId: string; playerId: string } | { error: string }
> {
  const supabase = getSupabaseServerClient();
  const normalizedCode = code.toUpperCase().trim();

  // Fetch the room
  const { data: room, error: fetchError } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", normalizedCode)
    .single();

  if (fetchError || !room) {
    return { error: "Room not found. Check the code and try again." };
  }

  const typedRoom = room as Room;

  if (typedRoom.status === "finished") {
    return { error: "This room has already finished." };
  }

  // Allow joining mid-game — new players wait for next round
  // if (typedRoom.status === "playing") { ... }

  const maxPlayers = typedRoom.game_config.maxPlayers || 10;
  if (typedRoom.players.length >= maxPlayers) {
    return { error: "This room is full." };
  }

  const playerId = generatePlayerId();
  const newPlayer: RoomPlayer = {
    id: playerId,
    name: playerName,
    connected: true,
    icon_index: typedRoom.players.length,
  };

  const updatedPlayers = [...typedRoom.players, newPlayer];

  const { error: updateError } = await supabase
    .from("rooms")
    .update({ players: updatedPlayers })
    .eq("id", typedRoom.id);

  if (updateError) {
    return { error: "Failed to join room. Please try again." };
  }

  return { roomId: typedRoom.id, playerId };
}

export async function getRoomByCode(
  code: string,
): Promise<Room | null> {
  const supabase = getSupabaseServerClient();
  const normalizedCode = code.toUpperCase().trim();

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", normalizedCode)
    .single();

  if (error || !data) return null;
  return data as Room;
}

export async function getRoomById(
  roomId: string,
): Promise<Room | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error || !data) return null;
  return data as Room;
}

export async function updateRoomState(
  roomId: string,
  hostId: string,
  gameState: GameState,
  status?: "waiting" | "playing" | "finished",
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();

  // Verify the caller is the host
  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();

  if (!room || room.host_id !== hostId) {
    return { success: false, error: "Only the host can update game state." };
  }

  const update: Record<string, unknown> = { game_state: gameState };
  if (status) update.status = status;

  const { error } = await supabase
    .from("rooms")
    .update(update)
    .eq("id", roomId);

  if (error) {
    return { success: false, error: "Failed to update game state." };
  }

  return { success: true };
}

export async function submitVote(
  roomId: string,
  playerId: string,
  votedForIndex: number,
): Promise<{ success: boolean; voteCount: number; error?: string }> {
  const supabase = getSupabaseServerClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("game_state, players")
    .eq("id", roomId)
    .single();

  if (!room) return { success: false, voteCount: 0, error: "Room not found." };

  const state = room.game_state as GameState;
  const players = room.players as RoomPlayer[];

  if (state.phase !== "voting" && state.phase !== "player-vote") {
    return { success: false, voteCount: 0, error: "Not in voting phase." };
  }

  // Check player is in the room
  const playerExists = players.some((p) => p.id === playerId);
  if (!playerExists) {
    return { success: false, voteCount: 0, error: "Player not in room." };
  }

  // Check player hasn't already voted
  if (state.votes[playerId] !== undefined) {
    return { success: false, voteCount: 0, error: "Already voted." };
  }

  const updatedVotes = { ...state.votes, [playerId]: votedForIndex };
  const updatedState = { ...state, votes: updatedVotes };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState })
    .eq("id", roomId);

  if (error) {
    return { success: false, voteCount: 0, error: "Failed to submit vote." };
  }

  return { success: true, voteCount: Object.keys(updatedVotes).length };
}

export async function markPlayerReady(
  roomId: string,
  playerId: string,
): Promise<{ success: boolean; readyCount: number; error?: string }> {
  const supabase = getSupabaseServerClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("game_state, players")
    .eq("id", roomId)
    .single();

  if (!room) return { success: false, readyCount: 0, error: "Room not found." };

  const state = room.game_state as ImposterOnlineState;

  if (state.readyPlayers.includes(playerId)) {
    return { success: true, readyCount: state.readyPlayers.length };
  }

  const updatedReady = [...state.readyPlayers, playerId];
  const updatedState = { ...state, readyPlayers: updatedReady };

  const { error } = await supabase
    .from("rooms")
    .update({ game_state: updatedState })
    .eq("id", roomId);

  if (error) {
    return { success: false, readyCount: 0, error: "Failed to mark ready." };
  }

  return { success: true, readyCount: updatedReady.length };
}

export async function removePlayer(
  roomId: string,
  hostId: string,
  targetPlayerId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("host_id, players")
    .eq("id", roomId)
    .single();

  if (!room || room.host_id !== hostId) {
    return { success: false, error: "Only the host can remove players." };
  }

  const players = room.players as RoomPlayer[];
  const updatedPlayers = players
    .filter((p) => p.id !== targetPlayerId)
    .map((p, i) => ({ ...p, icon_index: i }));

  const { error } = await supabase
    .from("rooms")
    .update({ players: updatedPlayers })
    .eq("id", roomId);

  if (error) {
    return { success: false, error: "Failed to remove player." };
  }

  return { success: true };
}
