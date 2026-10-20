const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface Message {
  role: "user" | "assistant"
  content: string
}

export type Topic = string

export async function fetchTopics(): Promise<Topic[]> {
  const res = await fetch(`${API_URL}/topics`)
  const data = await res.json()

  return data.topics as Topic[]
}

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
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
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
