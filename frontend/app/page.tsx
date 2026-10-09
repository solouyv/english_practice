"use client"

import { useState } from "react"
import { VoiceButton } from "@/components/VoiceButton"
import { ChatHistory } from "@/components/ChatHistory"
import { sendMessage, synthesizeSpeech, TOPICS } from "@/lib/api"
import type { Message, Topic } from "@/lib/api"

export default function Home() {
  const [topic, setTopic] = useState<Topic>("daily life")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  async function handleTranscribed(text: string) {
    const updated: Message[] = [...messages, { role: "user", content: text }]
    setMessages(updated)
    setLoading(true)

    try {
      const reply = await sendMessage(updated, topic)
      setMessages([...updated, { role: "assistant", content: reply }])
      await synthesizeSpeech(reply)
    } finally {
      setLoading(false)
    }
  }

  function handleTopicChange(newTopic: Topic) {
    setTopic(newTopic)
    setMessages([])
  }

  return (
    <main className="flex flex-col items-center gap-6 p-8 max-w-xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mt-4">English Practice</h1>

      <div className="flex flex-wrap gap-2 justify-center">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => handleTopicChange(t)}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              topic === t
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <ChatHistory
        messages={messages}
        loading={loading}
        onReplay={async () => {
          const last = [...messages].reverse().find((m) => m.role === "assistant")
          if (last) await synthesizeSpeech(last.content)
        }}
      />

      <VoiceButton onTranscribed={handleTranscribed} disabled={loading} />

      <p className="text-sm text-gray-400 pb-4">Hold button to speak · Release to send</p>
    </main>
  )
}
