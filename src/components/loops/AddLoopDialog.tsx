'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { X, ArrowDown, ArrowUp, Loader2, User, FileText, Calendar, RefreshCw, Mic, MicOff, Wand2, Keyboard } from 'lucide-react'

interface AddLoopDialogProps {
  open: boolean
  onClose: () => void
  onAdded?: () => void
}

type Mode = 'voice' | 'manual'
type RecordState = 'idle' | 'recording' | 'parsing'

// Extend window for SpeechRecognition (not in all TS lib versions)
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
  error: string
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: ISpeechRecognitionEvent) => void) | null
  onerror: ((e: ISpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

const EMPTY_FORM = { counterparty: '', description: '', expected_by: '', direction: 'inbound', source: 'manual' }

export function AddLoopDialog({ open, onClose, onAdded }: AddLoopDialogProps) {
  const [mode, setMode] = useState<Mode>('voice')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  // Voice state
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [transcript, setTranscript] = useState('')
  const [voiceHint, setVoiceHint] = useState('')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')

  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && mode === 'manual') setTimeout(() => firstRef.current?.focus(), 60)
    if (!open) {
      setForm(EMPTY_FORM)
      setTranscript('')
      setVoiceHint('')
      setRecordState('idle')
      finalTranscriptRef.current = ''
      recognitionRef.current?.stop()
    }
  }, [open, mode])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // ── Voice recording via Web Speech API ──────────────────────────────────────

  const startRecording = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) {
      toast.error('Voice input not supported in this browser. Use Chrome or Safari.')
      return
    }

    finalTranscriptRef.current = ''
    setTranscript('')
    setVoiceHint('Listening… speak naturally')

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onresult = (e: ISpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (final) finalTranscriptRef.current += final
      setTranscript((finalTranscriptRef.current + interim).trim())
    }

    recognition.onerror = (e: ISpeechRecognitionEvent) => {
      if (e.error === 'no-speech') setVoiceHint('No speech detected. Tap mic and try again.')
      else toast.error(`Mic error: ${e.error}`)
      setRecordState('idle')
    }

    recognition.onend = () => {
      // Only auto-stop if we were still recording (not manually stopped)
      if (recordState === 'recording') setRecordState('idle')
    }

    recognition.start()
    setRecordState('recording')
  }

  const stopAndParse = async () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null

    const text = finalTranscriptRef.current.trim() || transcript.trim()
    if (!text || text.length < 8) {
      setVoiceHint('Recording too short. Tap mic and describe your loop.')
      setRecordState('idle')
      return
    }

    setRecordState('parsing')
    setVoiceHint('Analysing your recording…')

    try {
      const res = await fetch('/api/loops/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Could not parse recording')
        setVoiceHint(data.error ?? 'Try again with more detail')
        setRecordState('idle')
        return
      }

      const { loop: parsed } = data
      setForm({
        counterparty: parsed.counterparty ?? '',
        description:  parsed.description  ?? '',
        expected_by:  parsed.expected_by  ?? '',
        direction:    parsed.direction    ?? 'inbound',
        source:       'manual',
      })
      setVoiceHint('✓ Extracted from your recording — review and confirm')
      setRecordState('idle')
      setMode('manual') // switch to form view so user can review
      toast.success('Loop extracted from voice!')
    } catch {
      toast.error('Failed to parse recording')
      setVoiceHint('Something went wrong. Try again.')
      setRecordState('idle')
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.counterparty || !form.description || !form.expected_by) return
    setLoading(true)
    try {
      const res = await fetch('/api/loops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expected_by: new Date(form.expected_by).toISOString() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Loop added')
      onAdded?.()
      onClose()
    } catch { toast.error('Failed to add loop') }
    finally { setLoading(false) }
  }

  if (!open) return null

  const defaultDate = new Date(Date.now() + 7 * 86400_000).toISOString().split('T')[0]
  const canSubmit = !loading && !!form.counterparty && !!form.description && !!form.expected_by
  const isRecording = recordState === 'recording'
  const isParsing = recordState === 'parsing'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg ring-1 ring-slate-200/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Track a new loop</h2>
            <p className="text-xs text-slate-400 mt-0.5">Speak or type — we'll figure out the rest</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-100">
          {([['voice', Mic, 'Voice'], ['manual', Keyboard, 'Manual']] as const).map(([m, Icon, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${
                mode === m
                  ? 'border-[#1a1a1a] text-[#1a1a1a]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── VOICE MODE ──────────────────────────────────────────────────────── */}
        {mode === 'voice' && (
          <div className="px-6 py-8 flex flex-col items-center gap-6">
            {/* Big mic button */}
            <div className="relative">
              <button
                onClick={isRecording ? stopAndParse : startRecording}
                disabled={isParsing}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 scale-110'
                    : isParsing
                    ? 'bg-[#1a1a1a]/25 cursor-not-allowed'
                    : 'bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 hover:scale-105'
                }`}
              >
                {isParsing
                  ? <Loader2 size={36} className="text-white animate-spin" />
                  : isRecording
                  ? <MicOff size={36} className="text-white" />
                  : <Mic size={36} className="text-white" />
                }
              </button>
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30 pointer-events-none" />
              )}
            </div>

            {/* State label */}
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-700">
                {isRecording ? 'Recording — tap to stop' : isParsing ? 'Analysing…' : 'Tap mic to start'}
              </p>
              {voiceHint && (
                <p className="text-xs text-slate-400 max-w-xs">{voiceHint}</p>
              )}
            </div>

            {/* Live transcript bubble */}
            {(transcript || isRecording) && (
              <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 min-h-[60px]">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wide">Transcript</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {transcript || <span className="text-slate-300 italic">Listening…</span>}
                </p>
              </div>
            )}

            {/* Instructions */}
            {!isRecording && !isParsing && !transcript && (
              <div className="w-full bg-[#7C5CFC]/6 rounded-2xl border border-[#7C5CFC]/15 p-4 space-y-2">
                <p className="text-xs font-semibold text-[#1a1a1a]/80 flex items-center gap-1.5">
                  <Wand2 size={12} className="text-[#7C5CFC]" /> What to say
                </p>
                <ul className="text-xs text-[#1a1a1a]/60 space-y-1.5 leading-relaxed">
                  <li>• <strong>Who</strong> owes you what — "Rahul needs to send the proposal"</li>
                  <li>• <strong>When</strong> you need it — "by Friday" / "end of month" / "next week"</li>
                  <li>• <strong>Direction</strong> — "I owe them" or "they owe me"</li>
                </ul>
                <p className="text-[10px] text-[#1a1a1a]/35 mt-2">Example: "Priya needs to confirm the meeting by Thursday, and I'm waiting on her."</p>
              </div>
            )}

            {/* Switch to manual */}
            <button
              onClick={() => setMode('manual')}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              Prefer typing? Switch to manual
            </button>
          </div>
        )}

        {/* ── MANUAL / REVIEW MODE ────────────────────────────────────────────── */}
        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Voice-filled indicator */}
            {voiceHint && voiceHint.startsWith('✓') && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                <Wand2 size={12} />
                {voiceHint}
              </div>
            )}

            {/* Direction toggle */}
            <div className="flex rounded-xl border border-slate-200 p-1 gap-1 bg-slate-50">
              {[
                { value: 'inbound',  label: 'They owe me', icon: ArrowDown },
                { value: 'outbound', label: 'I owe them',  icon: ArrowUp },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, direction: value }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    form.direction === value
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            {/* Source */}
            <div className="flex rounded-xl border border-slate-200 p-1 gap-1 bg-slate-50">
              {[
                { value: 'voice',    label: 'Voice',    emoji: '🎤' },
                { value: 'manual',   label: 'Manual',   emoji: '✏️' },
                { value: 'email',    label: 'Email',    emoji: '📧' },
                { value: 'calendar', label: 'Calendar', emoji: '📅' },
              ].map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, source: value }))}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    form.source === value
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>

            {/* Person */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User size={11} /> Person
              </label>
              <input
                ref={firstRef}
                type="text"
                required
                placeholder="e.g. Rahul Sharma, TechCorp HR…"
                value={form.counterparty}
                onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]/30 transition-all"
              />
            </div>

            {/* What */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={11} /> What
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Send revised proposal PDF, confirm the meeting time…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]/30 transition-all resize-none"
              />
            </div>

            {/* Due date */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar size={11} /> Expected by
                </label>
                <input
                  type="date"
                  required
                  value={form.expected_by}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, expected_by: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]/30 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, expected_by: defaultDate }))}
                className="self-end px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={11} /> +7d
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#1a1a1a]/85 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : 'Add Loop'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
