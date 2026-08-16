import React from "react";
import { useState, useEffect } from "react";
import { uploadFile } from "../services/api";

export default function Upload({ sessionId, onUploadSuccess }) {
 // const [file, setFile] = useState(null);
 const API_URL = import.meta.env.VITE_API_URL;
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
 const [file, setFile] = useState([]);
  useEffect(() => {
  setFile([]);
  setMessage("");
  setUploading(false);
  }, [sessionId]);

  const handleUpload = async () => {
      if (!file.length) {
        setMessage("⚠️ Please select a file");
        return;
      }
      setUploading(true);
      setMessage("");
      
   try {
      for (let f of file) {   
        const formData = new FormData();
          formData.append("file", f);
          formData.append("session_id", sessionId);
        
        const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setMessage(`❌ Upload failed  ${f.name}`);
        setUploading(false);
        return;
      }
    }   
      setMessage("✅ All Files uploaded successfully");
      setFile([]);
      setTimeout(() => {
          setMessage("");
        }, 3000);
       if (onUploadSuccess) {
        onUploadSuccess(file.map(f=> ({name:f.name})));
      }

    } catch (err) {
      setMessage("❌ Error uploading file");
    }
     setUploading(false);
  };

return (
    <div style={{ marginBottom: "15px" }}>
      <input type="file" multiple onChange={(e) => setFile([...e.target.files])} />
      {file.length > 0 && (
        <ul style={{ marginTop: "10px", fontSize: "13px" }}>
          {file.map((f, i) => (
            <li key={i}>{f.name}</li>
          ))}
        </ul>
      )}
      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          marginLeft: "10px",
          padding: "6px 12px",
          background: uploading ? "#999" : "#2a5298",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: uploading ?"not-allowed" :"pointer",
        }}
      > 
        {uploading ? "Uploading..." : "Upload"}
       
      </button>
       {uploading&& (
          <div style={{ marginTop: "10px", color: "#2a5298" }}>
            ⏳ Uploading & processing document...
          </div>
        )}
      {message && sessionId && (
        <div style={{ marginTop: "10px", color: "#444" }}>
          {message}
        </div>
      )}
    </div>
  );
}