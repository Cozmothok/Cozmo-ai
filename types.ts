import { Part } from "@google/genai";

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: Role;
  content: string | Part[];
  imageUrl?: string;
  sources?: Array<{ uri: string; title: string; }>;
  toolCalls?: any[];
  toolResults?: any[];
}