import { useState, useCallback } from 'react'
import { classifyStream } from '../api'

export function useComplaintPipeline() {
  const [state, setState]           = useState('idle')
  const [streamStage, setStage]     = useState(null)
  const [chunksFound, setChunks]    = useState(null)
  const [result, setResult]         = useState(null)
  const [chunks, setChunkData]      = useState([])
  const [debug, setDebug]           = useState(null)
  const [error, setError]           = useState(null)
  const [translated, setTranslated] = useState(null)

  const startPipeline = useCallback(async (text) => {
    setState('streaming'); setStage(null); setChunks(null)
    setResult(null); setChunkData([]); setDebug(null)
    setError(null); setTranslated(null)

    try {
      const res = await classifyStream(text)
      if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail) }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.stage === 'retrieval_start')    setStage('retrieval_start')
            if (ev.stage === 'translated')          setTranslated(ev)
            if (ev.stage === 'retrieval_complete') {
              setStage('retrieval_complete')
              setChunks(ev.chunks_found)
              setChunkData(ev.chunks || [])
              setDebug(ev.debug)
            }
            if (ev.stage === 'llm_start')          setStage('llm_start')
            if (ev.stage === 'complete')  { setResult(ev.classification); setState('done') }
            if (ev.stage === 'error')     throw new Error(ev.detail)
          } catch (parseErr) { if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr }
        }
      }
    } catch (err) { setError(err.message); setState('error') }
  }, [])

  return { state, streamStage, chunksFound, result, chunks, debug, error, translated, startPipeline }
}