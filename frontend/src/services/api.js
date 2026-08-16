//const BASE_URL = "http://localhost:8000";
const BASE_URL = import.meta.env.VITE_API_URL;

export const uploadFile = async (file, sessionId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
};

export const askQuestion = async (question, sessionId, onChunk) => {
  if (!question) return; // ❗ prevent empty query

  const res = await fetch(
    `${BASE_URL}/ask?query=${encodeURIComponent(
      question
    )}&session_id=${sessionId}`
  );

  // ✅ ADD THIS HERE (right after fetch)
  if (!res.ok) {
    const err = await res.json();
    onChunk("⚠️ " + err.error);
    return;
  }

  if (!res.body) {
    console.error("No response body");
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    result += chunk;
    console.log("Chunk:", chunk); // 👈 DEBUG
    onChunk(result);
  }
};

export const deleteSession = async (sessionId) => {
  await fetch(`${BASE_URL}/delete_session?session_id=${sessionId}`, {
    method: "DELETE",
  });
};