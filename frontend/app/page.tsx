"use client"

import { useState, useEffect } from "react"
import { VoiceButton } from "@/components/VoiceButton"
import { ChatHistory } from "@/components/ChatHistory"
import { sendMessage, synthesizeSpeech, fetchTopics } from "@/lib/api"
import type { Message, Topic } from "@/lib/api"

export default function Home() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [topic, setTopic] = useState<Topic>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTopics().then((t) => {
      setTopics(t)
      setTopic(t[0] ?? "")
    })
  }, [])

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
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col p-4 gap-1 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Topics</h2>
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => handleTopicChange(t)}
            className={[
              "text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              topic === t
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </aside>

      <main className="flex flex-col flex-1 min-w-0 p-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 shrink-0">English Practice</h1>

        <ChatHistory
          messages={messages}
          loading={loading}
          onReplay={async () => {
            const last = [...messages].reverse().find((m) => m.role === "assistant")
            if (last) await synthesizeSpeech(last.content)
          }}
        />

        <div className="shrink-0 flex flex-col items-center gap-2">
          <VoiceButton onTranscribed={handleTranscribed} disabled={loading || !topic} />
          <p className="text-sm text-gray-400">Hold button to speak · Release to send</p>
        </div>
      </main>
    </div>
  )
}
