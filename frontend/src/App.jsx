import React from "react";
import { useState,useEffect } from "react";
import Upload from "./components/upload";
import Chat from "./components/chat";
import { deleteSession } from "./services/api";

export default function App() {
  
  const API_URL = import.meta.env.VITE_API_URL;
  console.log("API_URL:", API_URL);
  const generateId =()=> Math.random().toString(36).substring(2, 8);
  const initialSession = React.useMemo(()=>{
    return(
    "user_" + generateId());},[])

  const [sessions, setSessions] = useState(() => {
          const saved = localStorage.getItem("chatApp");
          if (saved) {
            try {
              const data = JSON.parse(saved);
              return Array.isArray(data.sessions) ? data.sessions : [];
            } catch {
              return [];
            }
          }
          return [];
        });
  const [currentSession, setCurrentSession] = useState(() => {
          const saved = localStorage.getItem("chatApp");
          return saved ? JSON.parse(saved).currentSession : null;
        });
  const [lastQuestion, setLastQuestion] = useState("");
 // const [chatKey, setChatKey] = useState(0); // 🔥 force re-render
  const [allChats, setAllChats] = useState(() => {
        const saved = localStorage.getItem("chatApp");
        return saved ? JSON.parse(saved).allChats || {} : {};
      });
  const [uploadedSessions, setUploadedSessions] = useState(() => {
          const saved = localStorage.getItem("chatApp");
          return saved ? JSON.parse(saved).uploadedSessions || {} : {};
        });
  const [chatTitles, setChatTitles] = useState(() => {
        const saved = localStorage.getItem("chatApp");
        return saved ? JSON.parse(saved).chatTitles || {} : {};
      });
//  const [hasUploaded, setHasUploaded] = useState(false);
const [editingId, setEditingId] = useState(null);
const [tempTitle, setTempTitle] = useState("");

    const [sessionFiles, setSessionFiles] = useState(() => {
      const saved = localStorage.getItem("chatApp");
      return saved ? JSON.parse(saved).sessionFiles || {} : {};
    });
//const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
   if (!currentSession && sessions.length > 0) {
    setCurrentSession(sessions[0]);
  }

  if (sessions.length === 0) {
    const newId = "user_" + generateId();
    setSessions([newId]);
    setCurrentSession(newId);
  }
}, []);

useEffect(() => {
  localStorage.setItem("chatApp", JSON.stringify({
    sessions,
    currentSession,
    allChats,
    uploadedSessions,
    chatTitles,
    sessionFiles
  }));
}, [sessions, currentSession, allChats, uploadedSessions, chatTitles,sessionFiles]);
const createNewChat = () => {
  const newId = "user_"  + generateId(); // ✅ unique id
  setSessions(prev => 
    {if (prev.includes(newId)) return prev;
      return[...prev, newId];
    });
  setCurrentSession(newId);
//  setHasUploaded(false);
};
const deleteChat = async (sessionIdToDelete) => {
  try {
      //delete from backend
      await deleteSession(sessionIdToDelete);
    }catch(err){
      console.error("Backend delete failed",err)
    }

setSessions(prev => {
    const updated = prev.filter(s => s !== sessionIdToDelete);

    if (updated.length === 0) {
      const newId =
        "user_" +
         generateId();

      setCurrentSession(newId);
      return [newId];
    }

    if (currentSession === sessionIdToDelete) {
      setCurrentSession(updated[0]);
    }
  return updated;
});

  setAllChats(prev => {
    const updated = { ...prev };
    delete updated[sessionIdToDelete];
    return updated;
  });
    setUploadedSessions(prev => {
    const updated = { ...prev };
    delete updated[sessionIdToDelete];
    return updated;
  });
    setChatTitles(prev => {
    const updated = { ...prev };
    delete updated[sessionIdToDelete];
    return updated;
  });
 
};
//
  const deleteFile = async (fileName) => {
  // ✅ remove from UI first
  console.log("🔥 Delete file clicked:", fileName);
  setSessionFiles(prev => ({
    ...prev,
    [currentSession]: (prev[currentSession] || []).filter(
      f => f.name !== fileName
    )
  }));

  // ✅ OPTIONAL: delete from backend
  try {
    const res = await fetch(`${API_URL}/delete_file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_id: currentSession,
        file_name: fileName
      })
    });
    if (!res.ok) {
      throw new Error("API failed");
      }
      const data = await res.json();
    console.log("✅ API response:", data);
  } catch (err) {
    console.error("Delete file failed", err);
  }

};
  console.log("Sessions:", sessions);
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🧭 Sidebar */}
      <div style={{
        width: "220px",
        borderRight: "1px solid #ddd",
        padding: "10px",
        background: "#f9f9f9"
      }}>
        <button
          onClick={createNewChat}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            background: "#2a5298",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          + New Chat
        </button>

        {sessions.map((s) => (
          <div
            key={s}
            className="chat-item"
            onClick={() => {
              setCurrentSession(s);
              setLastQuestion("");//reset
              }}
            style={{
              display:"flex",
              justifyContent:"space-between",
              alignItems:"center",
              padding: "8px",
              marginBottom: "5px",
              cursor: "pointer",
              background: s === currentSession ?  "#e0e7ff" : "transparent",
              fontWeight:s === currentSession ? "bold" :"normal",         
              borderRadius: "5px"
            }}
          >
               {editingId === s ? (   //renaming chat titles
              <input
                value={tempTitle}
                autoFocus
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => {
                  setChatTitles(prev => ({
                    ...prev,
                    [s]: tempTitle || prev[s] || s
                  }));
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setChatTitles(prev => ({
                      ...prev,
                      [s]: tempTitle || prev[s] || s
                    }));
                    setEditingId(null);
                  }
                }}
                style={{ width: "120px" }}
              />
            ) : (
              <span
                onDoubleClick={() => {
                  setEditingId(s);
                  setTempTitle(chatTitles[s] || "");
                }}
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "120px",
                  display: "inline-block"
                }}
              >
                {chatTitles[s] || s}
              </span>
            )}
           {/* 🗑️ Delete button */}
            <span
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation(); // prevent switching chat
                deleteChat(s);
              }}
              style={{
                opacity:0,
                transition:"0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            >
              🗑️
            </span>
          </div>
        ))}
      </div>

      {/* 💬 Main Area */}
      <div style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto"
      }}>
        <h2 style={{ textAlign: "center" }}>
          Ask anything from Q&A App
        </h2>

            <Upload
              key={"upload_"+currentSession}
              sessionId={currentSession}
              onUploadSuccess={(files) => {
                // ✅ mark session as uploaded
                setUploadedSessions(prev => ({
                  ...prev,
                  [currentSession]: true
                }));
                  // ✅ SAVE FILE NAMES PER SESSION
                  setSessionFiles(prev => ({
                    ...prev,
                    [currentSession]: [
                      ...new Map(
                      [...(prev[currentSession] || []), ...files].map(f=>[f.name,f])
                      ).values()
                    ]
                  }));
                if (lastQuestion) {
                  window.dispatchEvent(new Event("ask-again"));
                }
              }}
            /> 
                        {/* ✅ 🔥 Display uploaded files in UI */}
            {sessionFiles[currentSession]?.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>📂 Uploaded Files:</strong>
                <ul style={{ fontSize: "13px", marginTop: "5px" }}>
                 {sessionFiles[currentSession].map((f, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "5px"
                        }}
                      >
                       <span>{f.name}</span>

                        <span
                          onClick={(e) => deleteFile(f.name)}
                          style={{
                            cursor: "pointer",
                            color: "red",
                            marginLeft: "10px"
                          }}
                          title="Delete file"
                          onMouseEnter={(e) => e.currentTarget.style.opacity = 0.6}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                        >
                          🗑️
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
       <Chat
          key={"chat_"+currentSession}
          sessionId={currentSession}
          messages={allChats[currentSession] || []}
          setMessages={(msgs) =>
            setAllChats(prev => ({
              ...prev,
              [currentSession]:Array.isArray(msgs) 
                ?msgs
                :prev[currentSession] || []
            }))
          }
          lastQuestion={lastQuestion}  
          setLastQuestion={setLastQuestion}
          hasUploaded={!!uploadedSessions[currentSession]}
          setChatTitles={setChatTitles}
        />
      </div>
    </div>
  );
}