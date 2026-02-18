import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, push, serverTimestamp, update } from "firebase/database";
import { format } from "date-fns/format";
import styles from "../styles/ChatRoom.module.scss"; // ✅ Exact path?

// TEST: Console log immediately after import
console.log("STYLES:", styles); // Should log { room: "...", header: "...", ... }
console.log("inputForm:", styles.inputForm); // Should log "input-form_def456"

interface RoomProps {
  userName: string;
}

export const ChatRoom = ({ userName }: RoomProps) => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [filter, setFilter] = useState("");
  const [typing, setTyping] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  //Animate Scroll to bottom on new message
  const scrollToBottom = useCallback(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Subscribe to incoming messages
  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    const msgsRef = ref(db, `rooms/${roomId}/messages`);
    const unsub = onValue(msgsRef, (snap) => {
      const data = snap.val();
      setMessages(
        data ? Object.entries(data).map(([id, m]: any) => ({ id, ...m })) : []
      );
      setLoading(false);
    });

    setTimeout(scrollToBottom, 0);
    return unsub;
  }, [roomId, scrollToBottom]);

  // Scroll to bottom when messages change (new incoming)
  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages.length, Array.from(typing).length, scrollToBottom, loading]);

  // Typing indicator ...
  useEffect(() => {
    if (!roomId) return;
    const typingRef = ref(db, `rooms/${roomId}/typing`);
    const unsub = onValue(typingRef, (snap) => {
      const data = snap.val();
      setTyping(data ? new Set(Object.keys(data)) : new Set());
    });
    return unsub;
  }, [roomId]);

  const sendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    handleTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const msgsRef = ref(db, `rooms/${roomId!}/messages`);
    await push(msgsRef, {
      name: userName,
      text: newMsg.trim(),
      timestamp: serverTimestamp(),
    });
    setNewMsg("");
  };

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId || !userName) return;
      const typingRef = ref(db, `rooms/${roomId}/typing/${userName}`);

      if (isTyping) {
        update(typingRef, { typing: true });
      } else {
        import("firebase/database").then(({ remove }) => {
          remove(typingRef);
        });
      }
    },
    [roomId, userName]
  );

  // Group consecutive from same user
  const groupConsecutive = (msgs: any[]) => {
    if (!msgs.length) return [];
    const grouped: any[][] = [[msgs[0]]];
    for (let i = 1; i < msgs.length; i++) {
      if (msgs[i].name === msgs[i - 1].name) {
        grouped[grouped.length - 1].push(msgs[i]);
      } else {
        grouped.push([msgs[i]]);
      }
    }
    return grouped;
  };

  const filteredMsgs = messages
    .filter((m: any) => m.text?.toLowerCase().includes(filter.toLowerCase()))
    .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));

  const groupedMsgs = groupConsecutive(filteredMsgs);

  if (loading) return <div className="loading">Connecting...</div>;

  return (
    <div className={styles.room} role="main">
      <header className={styles.header} role="banner">
        <Link to="/" className={styles.back} aria-label="Return to Chat Lobby">
          ← Chat Lobby
        </Link>
        <h1>Room ID: {roomId?.toUpperCase()}</h1> {/* h1 > h2 for landmark */}
      </header>

      <section
        className={styles.messages}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <label htmlFor="search-messages" className="srOnly">
          Search messages
        </label>
        <input
          id="search-messages"
          type="search" // ✅ Semantic search input
          placeholder="Search messages..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.search}
          aria-describedby="search-help"
        />
        <small id="search-help" className="srOnly">
          Type to filter chat history
        </small>

        {groupedMsgs.map((group: any[]) => (
          <article key={group[0].id} className={styles.msgGroup} role="log">
            {group.map((msg: any) => (
              <div
                key={msg.id}
                className={`${styles.msg} ${
                  msg.name === userName ? styles.own : ""
                }`}
                role="article"
                aria-labelledby={`msg-${msg.id}-author`}
              >
                <strong id={`msg-${msg.id}-author`}>{msg.name}</strong>
                <time
                  className={styles.time}
                  dateTime={
                    msg.timestamp ? new Date(msg.timestamp).toISOString() : ""
                  }
                  aria-label={`Sent at ${format(
                    new Date(msg.timestamp),
                    "HH:mm"
                  )}`}
                >
                  {format(new Date(msg.timestamp), "HH:mm")}
                </time>
                <p>{msg.text}</p>
              </div>
            ))}
          </article>
        ))}

        <div
          ref={msgsEndRef}
          className={styles.typingIndicator}
          role="status"
          aria-live="assertive"
          aria-atomic="true"
        >
          {Array.from(typing).filter((name) => name !== userName).length >
            0 && (
            <span aria-label="Users typing">
              {Array.from(typing)
                .filter((name) => name !== userName)
                .join(", ")}{" "}
              typing...
            </span>
          )}
        </div>
      </section>

      <form
        onSubmit={sendMsg}
        className={styles.inputForm}
        aria-label="Send message"
      >
        <label htmlFor="message-input" className="srOnly">
          Type your message
        </label>
        <div className="input-wrapper">
          <input
            id="message-input"
            type="text"
            placeholder="Type a message..."
            value={newMsg}
            onChange={(e) => {
              const typing = e.target.value.length > 0;
              setNewMsg(e.target.value);
              handleTyping(typing);
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              if (typing) {
                typingTimeoutRef.current = setTimeout(() => {
                  handleTyping(false);
                }, 1500);
              } else {
                typingTimeoutRef.current = null;
              }
            }}
            className={styles.msgInput}
            disabled={loading}
            autoComplete="off"
            aria-describedby="send-help"
            maxLength={500}
          />
          <small id="send-message" className="srOnly">
            Press Enter to send, Escape to clear
          </small>
        </div>

        <button
          type="submit"
          disabled={!newMsg.trim() || loading}
          className={styles.sendButton}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  );
};
