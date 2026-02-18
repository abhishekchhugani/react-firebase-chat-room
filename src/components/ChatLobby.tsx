import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, set, onValue } from "firebase/database";
import styles from "../styles/ChatLobby.module.scss"; // ✅ SCSS Module import

interface LobbyProps {
  onJoin: (name: string, room: string) => void;
}

export const ChatLobby = ({ onJoin }: LobbyProps) => {
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [rooms, setRooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Grab Existing rooms
  useEffect(() => {
    const roomsRef = ref(db, "rooms");
    onValue(roomsRef, (snap) => {
      const data = snap.val();
      setRooms(data ? Object.keys(data) : []);
    });
  }, []);

  // Validate user inputs
  const validate = () => {
    if (!userName.trim()) return "Name required";
    if (!roomCode.trim()) return "Room code required";
    return "";
  };

  // Method to create room
  const createRoom = async () => {
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    const roomId = roomCode.trim().toLowerCase();
    try {
      await set(ref(db, `rooms/${roomId}`), { created: Date.now() });
      onJoin(userName.trim(), roomId);
    } catch (e) {
      setError("Sorry! failed to create room. Please try again");
    }
    setLoading(false);
  };

  // Method to Join a room
  const joinRoom = async () => {
    const roomId = roomCode.trim().toLowerCase();
    if (!rooms.includes(roomId)) return setError("Room not found!!!.");
    const err = validate();
    if (err) return setError(err);
    onJoin(userName.trim(), roomId);
  };

  return (
    <div className={styles.lobby} role="main">
      <section className={styles.card} aria-labelledby="lobby-title">
        <h1 id="lobby-title" className={styles.cardHeader}>
          UniMonChat 🤖
        </h1>

        <form role="form" aria-label="Join chat room" className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="username-input" className="srOnly">
              Username
            </label>
            <input
              id="username-input"
              type="text"
              placeholder="Enter your username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={styles.input}
              maxLength={20}
              required
              aria-describedby="username-help"
              autoComplete="nickname"
            />
            <small id="username-help" className="srOnly">
              2-20 characters
            </small>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="roomcode-input" className="srOnly">
              Room code
            </label>
            <input
              id="roomcode-input"
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className={styles.input}
              required
              aria-describedby="roomcode-help"
              autoComplete="off"
              aria-invalid={!!error}
            />
            <small id="roomcode-help" className="srOnly">
              Alphanumeric code for room
            </small>
          </div>

          {error && (
            <div role="alert" aria-live="assertive" className={styles.error}>
              {error}
            </div>
          )}

          <div
            className={styles.buttons}
            role="group"
            aria-label="Room actions"
          >
            <button
              type="button"
              onClick={createRoom}
              disabled={loading || !userName.trim() || !roomCode.trim()}
              className={`${styles.btn} ${styles.primary}`}
              aria-describedby={error ? "error" : undefined}
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
            <button
              type="button"
              onClick={joinRoom}
              disabled={
                loading ||
                !userName.trim() ||
                !roomCode.trim() ||
                !rooms.includes(roomCode.trim().toLowerCase())
              }
              className={styles.btn}
              aria-describedby={error ? "error" : undefined}
            >
              Join Room
            </button>
          </div>
        </form>

        <section aria-labelledby="rooms-heading" className={styles.rooms}>
          <h2 id="rooms-heading">Existing Rooms:</h2>
          <ul aria-label="Available chat rooms">
            {rooms.length > 0 ? (
              rooms.map((r) => (
                <li key={r} tabIndex={0} className={styles.roomItem}>
                  {r}
                  <small className="srOnly"> room code</small>
                </li>
              ))
            ) : (
              <li className={styles.emptyList}>
                No rooms yet. Create the first one!
              </li>
            )}
          </ul>
        </section>
      </section>
    </div>
  );
};
