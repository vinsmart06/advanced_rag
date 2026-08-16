import React from "react";
import Upload from "./components/upload";
import Chat from "./components/chat";

function App() {
  const sessionId = "user123"; // 🔥 replace with real auth later

  return (
    <div>
      <h1>Advanced RAG App</h1>

      <Upload sessionId={sessionId} />
      <Chat sessionId={sessionId} />
    </div>
  );
}

export default App;