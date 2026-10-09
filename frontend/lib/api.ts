const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface Message {
  role: "user" | "assistant"
  content: string
}

export type Topic =
  | "travel" | "work" | "daily life" | "hobbies" | "technology" | "food"
  | "B2 Unit 1 Grammar Drill"
  | "B2 Unit 2 Contrastive Pairs"
  | "B2 Unit 2 Phrasal Verbs"
  | "B2 Unit 2 Word Formation"
  | "B2 Unit 2 Conversation"
  | "B2 Scenario Loop"

export const TOPICS: Topic[] = [
  "travel", "work", "daily life", "hobbies", "technology", "food",
  "B2 Unit 1 Grammar Drill",
  "B2 Unit 2 Contrastive Pairs",
  "B2 Unit 2 Phrasal Verbs",
  "B2 Unit 2 Word Formation",
  "B2 Unit 2 Conversation",
  "B2 Scenario Loop",
]

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData()
  form.append("audio", blob, "recording.webm")

  const res = await fetch(`${API_URL}/transcribe`, { method: "POST", body: form })
  const data = await res.json()

  return data.text as string
}

export async function sendMessage(messages: Message[], topic: Topic): Promise<string> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, topic }),
  })
  const data = await res.json()

  return data.text as string
}

export async function synthesizeSpeech(text: string): Promise<void> {
  const res = await fetch(`${API_URL}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.onended = () => URL.revokeObjectURL(url)

  await audio.play()
}
