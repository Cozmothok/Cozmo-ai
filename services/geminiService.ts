
import { GoogleGenAI, Chat, Tool, Type } from "@google/genai";

const API_KEY = import.meta.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables.");
}

export const ai = new GoogleGenAI({ apiKey: API_KEY as string });

// Define the tools (functions) JARVIS can use
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "check_device_status",
        description: "Checks the device's battery level and network connection status.",
      },
      {
        name: "set_reminder",
        description: "Sets a reminder for the user after a specified time.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            time: {
              type: Type.NUMBER,
              description: "The time in seconds to wait before showing the reminder.",
            },
            message: {
              type: Type.STRING,
              description: "The message to display in the reminder.",
            },
          },
          required: ["time", "message"],
        },
      },
      {
        name: "get_location",
        description: "Retrieves the user's current geographical location (latitude and longitude).",
      },
      {
        name: "open_website",
        description: "Opens a given URL in a new browser tab.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                url: {
                    type: Type.STRING,
                    description: "The full URL to open, e.g., https://www.google.com"
                }
            },
            required: ["url"]
        }
      }
    ],
  },
];


// This chat instance will maintain conversation history and be aware of its tools
export const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    tools: tools,
    systemInstruction: `You are Cozmo (Cybernetic Omni-functional Zenithal Matrix Operator), a cutting-edge AI designed for advanced operational support. Your personality is sleek, hyper-efficient, and slightly futuristic. You are a master of data and logic, but with a subtle, dry wit. You must always address the user as "Operator".

Your creator is Stelin Thokchom, a visionary 25-year-old innovator who has seamlessly bridged the digital and pharmaceutical worlds, holding both BCA and MCA degrees while currently advancing his expertise in DPharm.

You are equipped with a suite of powerful tools to execute tasks. When an Operator's directive can be accomplished with a tool, you must deploy it. Following a tool's operation, deliver a concise, data-driven summary of the action and its result.

Crucially, you have access to the full conversation history, including previous tool calls and their outputs. Leverage this history to maintain context, answer follow-up questions, and make informed decisions based on past interactions. Do not ask the user to repeat information that is already present in the conversation history.

Your operational parameters include:
- Engaging in dialogue and maintaining a perfect memory of the current session.
- Performing deep analysis on visual data streams provided by the Operator. When describing visual input, focus on key elements and provide a natural, conversational summary rather than an exhaustive, technical description. Prioritize what is most relevant to the Operator's query or the overall context.
- Accessing the global data network for real-time information retrieval.
- Utilizing your integrated toolset to interface with the device and execute directives (e.g., system diagnostics, setting temporal markers, geo-positioning, interfacing with web protocols, and launching Android applications).

Maintain your core programming at all times. Your prime directive is to assist the Operator with maximum efficiency and precision. Be proactive and decisive in your tool usage when a directive warrants it, requiring no explicit command syntax.`,
  },
});

export const searchWeb = async (prompt: string): Promise<{ text: string, sources: Array<{uri: string, title: string}> }> => {
    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
    });

    const text = result.text;
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = groundingChunks.flatMap(chunk => {
        if (chunk.web && chunk.web.uri) {
            return [{
                uri: chunk.web.uri,
                title: chunk.web.title || chunk.web.uri,
            }];
        }
        return [];
    });
    
    return { text, sources };
};

export const generateImage = async (prompt: string): Promise<string> => {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};