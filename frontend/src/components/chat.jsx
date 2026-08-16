import React, { useState } from "react";
import { useEffect, useRef } from "react";
import { askQuestion } from "../services/api";

export default function Chat({ sessionId, messages, setMessages,lastQuestion, setLastQuestion,hasUploaded,setChatTitles }) {
  const [q, setQ] = useState("");
 // const [ans, setAns] = useState("");
 // const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
  setQ("");   // ✅ clear old question
  setError("");
}, [sessionId]);

  const handleAsk = async () => {
    if (!hasUploaded && messages.length === 0) {
      setError("⚠️ Please upload a document first");

      setTimeout(()=> { 
        setError("📂 Tip: Upload a file to get accurate answers");
      },2000);
      return;
    }
    if (!q.trim()) {
      setError("⚠️ Please enter a question");
      return;
         }
     setLastQuestion(q);  
        setError("");
    setLoading(true);
      if (!messages?.some(m=>m.role==="user")) {
        setChatTitles(prev => ({
          ...prev,
          [sessionId]: q.slice(0, 30) + "..."
        }));
      }
       // Add user message + empty AI message
    const newMessages = [
      ...(messages || []),
      { role: "user", text: q },
      { role: "ai", text: "", sources: [] },
    ];
    setMessages(newMessages);
    let aiText="";
    let noDocs = false;
      await askQuestion(q, sessionId, (chunk) => {
      aiText = chunk;
        // ✅ detect flag
      if (aiText.includes("⚠️ NO_DOCS")) {
        noDocs = true;
        aiText = aiText.replace("⚠️ NO_DOCS", "");
      }
      let mainText = aiText
      .replace(/^summary\s*/i, "")   // remove "summary" at start
      .replace(/^###\s*Summary.*\n?/i, ""); // remove markdown heading if present
      let sources = [];

      if (aiText.includes("📌 Sources:")) {
        const parts = aiText.split("📌 Sources:");
        mainText = parts[0];

        sources = parts[1]
          .split("\n")
          .filter((s) => s.trim())
          .map((s) => s.replace("- ", ""));
      }

        newMessages[newMessages.length - 1] = {
        role: "ai",
        text: mainText,
        sources: sources,
        noDocs:noDocs,
      };
      setMessages([...newMessages]);
    });
    setQ("");
    setLoading(false);
  };
  // ✅ 👉 ADD THIS HERE
  useEffect(() => {
    const handler = () => {
      if (lastQuestion && hasUploaded) {
        setQ(lastQuestion);
        handleAsk();   // 🔁 re-ask automatically after upload
      }
    };
    window.addEventListener("ask-again", handler);
       return () => {
      window.removeEventListener("ask-again", handler);
    };
  }, [lastQuestion,hasUploaded]);   // important dependency
 return (
    <div style={{ marginTop: "20px" }}>
      
      {/* ❗ Error Message */}
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </div>
      )}

      {/* 💬 Chat Messages */}
      <div>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "15px" }}>
            
            {/* Bubble */}
            <div
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                     // display :"inline-block",
                      maxWidth: "70%",
                      padding: "12px",
                      borderRadius: "12px",
                      background: msg.role === "user" ? "#007bff" : "#f1f1f1",
                      color: msg.role === "user" ? "white" : "black",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      textAlign: "left",   // ✅ FORCE LEFT ALIGN
                    }}
              >
                <>
                  {msg.noDocs && (
                    <div style={{
                      background: "#fff3cd",
                      color: "#856404",
                      padding: "8px",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      fontSize: "13px"
                    }}>
                      ⚠️ No documents available. Upload files to get better answers.
                    </div>
                  )}
                {msg.text}
                </>
              </div>
            </div>

            {/* 📌 Sources BELOW AI message */}
            {msg.role === "ai" && msg.sources?.length > 0 && (
              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  color: "#555",
                  paddingLeft: "5px",
                }}
              >
                <strong>Sources:</strong>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {msg.sources.map((src, idx) => (
                    <li key={idx}>{src}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 🧾 Input */}
      <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems:"center",
          marginTop: "20px",
          gap: "10px",
          width:"100%",
        }}>
        <textarea
          value={q}
          onChange={(e) =>{ setQ(e.target.value);
          if (!hasUploaded) {
              setError("⚠️ Please upload a document first");
          } else{
              setError("");
            }
          }}
          placeholder="Ask something..."
          rows={3}
          onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();   // ❗ stop new line
            handleAsk();          // ✅ send message
          }
          }}
          style={{
            flex:1,
            minWidth:"400px",
            maxWidth:"700px",
            width: "100%",
            marginRight: "10px",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            resize: "none",
            fontSize:"14px",
          }}
        />

        <button onClick={handleAsk}
        disabled={!hasUploaded}
        style={{
      padding: "12px 20px",
      borderRadius: "8px",
      background: hasUploaded ? "#2a5298" : "#ccc",
      color: "white",
      border: "none",
      cursor: hasUploaded ? "pointer" : "not-allowed",
      whiteSpace:"nowrap",
    }}
>
          {loading ? "Thinking..." : "Ask"}
        </button>
    
      </div>
             
        {!hasUploaded && (
            <div style={{ 
              opacity:0.8,
              transition:"opacity 0.3s",
              textAlign:"center",
              color: "gray",
               marginTop: "8px",
               fontSize:"13px",
                }}>
              📄 No documents uploaded yet. Please upload a document to start asking
              <br/>
               <span style={{ fontSize: "13px", color: "#666" }}>
                Upload  Docs to start asking questions
              </span>
            </div>
          )}
    </div>
  );
}