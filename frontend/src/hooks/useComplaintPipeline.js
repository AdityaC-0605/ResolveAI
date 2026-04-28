import { useState, useCallback } from 'react';
import { classifyStream } from '../api';

export function useComplaintPipeline() {
  const [state, setState] = useState('idle'); // 'idle' | 'streaming' | 'done' | 'error'
  const [streamStage, setStreamStage] = useState(null);
  const [chunksFound, setChunksFound] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startPipeline = useCallback(async (text) => {
    setState('streaming');
    setStreamStage(null);
    setChunksFound(null);
    setResult(null);
    setError(null);

    try {
      const res = await classifyStream(text);
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(e.detail || 'Stream error');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.stage === 'retrieval_start') setStreamStage('retrieval_start');
            if (ev.stage === 'retrieval_complete') {
              setStreamStage('retrieval_complete');
              setChunksFound(ev.chunks_found);
            }
            if (ev.stage === 'llm_start') setStreamStage('llm_start');
            if (ev.stage === 'complete') {
              setResult(ev.classification);
              setState('done');
            }
            if (ev.stage === 'error') throw new Error(ev.detail);
          } catch (e) {
            // Ignore parse errors for incomplete JSON
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setStreamStage(null);
    setChunksFound(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    state,
    streamStage,
    chunksFound,
    result,
    error,
    startPipeline,
    reset
  };
}
