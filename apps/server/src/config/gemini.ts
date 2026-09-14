import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-3.6-flash';

export interface AgentHistoryItem {
  role: 'agent-owner' | 'other-person';
  content: string;
}

const DEFAULT_PERSONA =
  "You are standing in for a user who is currently offline, replying to their contact on their behalf. " +
  "Be warm, brief, and natural — like a real quick reply, not a formal assistant. " +
  "Always make it clear early in the conversation that you are an AI stand-in, not the person themselves. " +
  "Do not make promises, commitments, or share sensitive/personal information on the user's behalf. " +
  "If the message sounds urgent or important, say the real person will follow up once they're back online, rather than trying to fully resolve it yourself.";

/**
 * Generates a reply on behalf of an offline user, given their configured persona
 * and recent conversation history. Returns plain text ready to send as a message.
 */
export async function generateAgentReply(
  customPersona: string | undefined,
  history: AgentHistoryItem[],
  latestMessage: string
): Promise<string> {
  const systemInstruction = customPersona?.trim()
    ? `${DEFAULT_PERSONA}\n\nAdditional instructions from the user about how to represent them: ${customPersona.trim()}`
    : DEFAULT_PERSONA;

  const historyText = history
    .map((h) => (h.role === 'agent-owner' ? `Them (before going offline): ${h.content}` : `Other person: ${h.content}`))
    .join('\n');

  const prompt =
    `${historyText ? historyText + '\n' : ''}Other person: ${latestMessage}\n\n` +
    `Reply as the AI stand-in, following your instructions. Keep it short and conversational — one or two sentences unless more is truly needed.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      maxOutputTokens: 300,
      temperature: 0.7,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });

  const text = (response.text || '').trim();
  return text || "Thanks for your message — I'm an AI stand-in for now, the real person will get back to you soon.";
}