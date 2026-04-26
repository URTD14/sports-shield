import { useState, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useStreamSSE() {
  const [text, setText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const abortRef = useRef(null)

  const startStream = useCallback(async (endpoint, body) => {
    setText('')
    setDone(false)
    setStreaming(true)

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break

        const chunk = decoder.decode(value, { stream: true })
        // Parse SSE format: "data: {...}\n\n"
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                setText((prev) => prev + data.text)
              }
            } catch {
              // Raw text chunk
              const raw = line.slice(6)
              if (raw && raw !== '[DONE]') setText((prev) => prev + raw)
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('[SSE Error]', err)
    } finally {
      setStreaming(false)
      setDone(true)
    }
  }, [])

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setStreaming(false)
  }, [])

  return { text, streaming, done, startStream, stop }
}
