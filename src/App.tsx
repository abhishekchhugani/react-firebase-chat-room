import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ChatLobby } from "./components/ChatLobby";
import { ChatRoom } from "./components/ChatRoom";
import "./styles/App.module.scss"; // Global transitions

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || ""
  );
  const [currentRoom, setCurrentRoom] = useState(
    localStorage.getItem("currentRoom") || ""
  );

  // Auto-redirect only on initial load to lobby
  useEffect(() => {
    if (userName && currentRoom && location.pathname === "/") {
      navigate(`/room/${currentRoom}`);
    }
  }, []); // Empty deps: once only

  // Clear storage when entering lobby (back nav/refresh)
  useEffect(() => {
    if (location.pathname === "/") {
      localStorage.removeItem("userName");
      localStorage.removeItem("currentRoom");
      setUserName("");
      setCurrentRoom("");
    }
  }, [location.pathname]);

  const setUserAndRoom = (name: string, room: string) => {
    localStorage.setItem("userName", name);
    localStorage.setItem("currentRoom", room);
    setUserName(name);
    setCurrentRoom(room);
    navigate(`/room/${room}`);
  };

  const logout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("currentRoom");
    setUserName("");
    setCurrentRoom("");
    navigate("/");
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<ChatLobby onJoin={setUserAndRoom} />} />
        <Route
          path="/room/:roomId"
          element={
            userName ? (
              <ChatRoom userName={userName} />
            ) : (
              <ChatLobby onJoin={setUserAndRoom} />
            )
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
