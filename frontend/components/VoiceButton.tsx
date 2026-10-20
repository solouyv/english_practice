"use client"

import { useRef, useState, useEffect } from "react"
import { transcribeAudio } from "@/lib/api"

interface Props {
  onTranscribed: (text: string) => void
  disabled: boolean
}

export function VoiceButton({ onTranscribed, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingRef = useRef(false)
  const onTranscribedRef = useRef(onTranscribed)
  onTranscribedRef.current = onTranscribed

  useEffect(() => {
    function toggle() {
      if (disabled) return
      if (recordingRef.current) stopRecording()
      else startRecording()
    }

    function onKey(e: KeyboardEvent) {
      if (e.repeat) return
      if (e.code === "Space" || e.key === "MediaPlayPause") {
        e.preventDefault()
        toggle()
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [disabled])

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const text = await transcribeAudio(blob)
      if (text.trim()) onTranscribedRef.current(text)
    }

    recorderRef.current = recorder
    recorder.start()
    recordingRef.current = true
    setRecording(true)
  }

  function stopRecording() {
    recorderRef.current?.stop()
    recordingRef.current = false
    setRecording(false)
  }

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      disabled={disabled}
      className={[
        "w-24 h-24 rounded-full font-bold text-white transition-all select-none",
        recording
          ? "bg-red-500 scale-110 shadow-lg shadow-red-200"
          : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {recording ? "🔴 Stop" : "🎤 Hold"}
    </button>
  )
}
