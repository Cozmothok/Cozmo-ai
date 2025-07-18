import Groq from "groq-sdk";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!API_KEY) {
  console.error("GROQ_API_KEY is not set in environment variables.");
}

export const groq = new Groq({
  apiKey: API_KEY as string,
});

export async function getGroqChatCompletion(messages: any[]) {
  return groq.chat.completions.create({
    messages: messages,
    model: "llama3-8b-8192", // Default Groq model
  });
}