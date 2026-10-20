import { useEffect, useRef } from "react"
import type { Message } from "@/lib/api"

interface Props {
  messages: Message[]
  loading: boolean
  onReplay: () => void
}

export function ChatHistory({ messages, loading, onReplay }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const lastAssistantIndex = messages.reduce(
    (last, m, i) => (m.role === "assistant" ? i : last),
    -1,
  )

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto border rounded-xl p-4 flex flex-col gap-3 bg-white">
      {messages.length === 0 && (
        <p className="text-center text-gray-400 mt-8 text-sm">
          Select a topic and hold the button to start speaking
        </p>
      )}
      {messages.map((m, i) => (
        <div
          key={i}
          className={[
            "flex flex-col gap-1",
            m.role === "user" ? "items-end" : "items-start",
          ].join(" ")}
        >
          <div
            className={[
              "px-4 py-2 rounded-2xl max-w-xs text-sm leading-relaxed",
              m.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800",
            ].join(" ")}
          >
            {m.content}
          </div>
          {i === lastAssistantIndex && !loading && (
            <button
              onClick={onReplay}
              className="text-xs text-gray-400 hover:text-gray-600 px-1"
            >
              🔊 replay
            </button>
          )}
        </div>
      ))}
      {loading && (
        <div className="self-start bg-gray-100 px-4 py-2 rounded-2xl text-sm text-gray-400">
          Thinking...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
