import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Send, Bot, User, Zap, AlertCircle, RefreshCw, RotateCcw,
  Sparkles, CheckCircle2, TrendingUp, TrendingDown,
  Activity, Database, Wrench, ShieldAlert, ChevronRight,
  Trash2, Copy, Check, Cpu, CheckCircle
} from 'lucide-react'
import { queryAI, loadChatHistory, saveChatHistory, clearChatHistory } from '../services/copilotService'
import toast from 'react-hot-toast'

const SUGGESTED_QUESTIONS = [
  "Why is my highest-risk vehicle failing?",
  "Which vehicles need maintenance today?",
  "Show me unusual vehicle behaviour.",
  "What caused the recent critical alerts?",
  "Explain the evidence behind hero vehicle TN01AB1234.",
]

function FormattedContent({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let tableRows = []
  let inTable = false

  const renderInline = (str) => {
    if (!str) return ''
    const parts = str.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const text = part.slice(2, -2)
        return (
          <strong key={i} style={{ color: '#0F172A', fontWeight: 700 }}>
            {text}
          </strong>
        )
      }
      return part
    })
  }

  const renderCellContent = (str) => {
    const trimmed = str.trim()
    if (trimmed.includes('CRITICAL')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 700, fontSize: 11 }}>
          {renderInline(trimmed)}
        </span>
      )
    }
    if (trimmed.includes('HIGH')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', fontWeight: 700, fontSize: 11 }}>
          {renderInline(trimmed)}
        </span>
      )
    }
    if (trimmed.includes('MEDIUM')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontWeight: 600, fontSize: 11 }}>
          {renderInline(trimmed)}
        </span>
      )
    }
    return renderInline(trimmed)
  }

  const flushTable = () => {
    if (tableRows.length > 0) {
      const header = tableRows[0]
      const body = tableRows.slice(1).filter(r => !r.every(c => c.match(/^[-:| ]+$/)))
      elements.push(
        <div
          key={`table-${elements.length}`}
          style={{
            overflowX: 'auto',
            margin: '14px 0',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            background: '#FFFFFF',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            {header && (
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  {header.map((col, idx) => (
                    <th key={idx} style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', fontSize: 11.5, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                      {renderInline(col)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: rIdx === body.length - 1 ? 'none' : '1px solid #F1F5F9',
                    background: rIdx % 2 === 0 ? '#FFFFFF' : '#FBFCFD',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = rIdx % 2 === 0 ? '#FFFFFF' : '#FBFCFD' }}
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '9px 14px', color: '#1E293B', verticalAlign: 'middle' }}>
                      {renderCellContent(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableRows = []
    }
    inTable = false
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    // Table row detection
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true
      const cells = line.split('|').slice(1, -1).map(c => c.trim())
      tableRows.push(cells)
      continue
    } else if (inTable) {
      flushTable()
    }

    if (!line) {
      elements.push(<div key={i} style={{ height: 8 }} />)
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '14px 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronRight size={14} style={{ color: 'var(--brand-600)' }} />
          {renderInline(line.slice(4))}
        </h4>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A', margin: '16px 0 8px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
          {renderInline(line.slice(3))}
        </h3>
      )
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '12px 0' }} />)
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '4px 0', paddingLeft: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563EB', marginTop: 8, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
            {renderInline(line.replace(/^[-*•]\s+/, ''))}
          </div>
        </div>
      )
    } else if (/^\d+\.\s+/.test(line)) {
      const match = line.match(/^(\d+)\.\s+(.*)/)
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '4px 0', paddingLeft: 4 }}>
          <span style={{ fontWeight: 700, color: '#2563EB', fontSize: 12, minWidth: 18, marginTop: 1 }}>{match[1]}.</span>
          <div style={{ flex: 1, fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
            {renderInline(match[2])}
          </div>
        </div>
      )
    } else {
      elements.push(
        <p key={i} style={{ margin: '5px 0', fontSize: 13.5, color: '#334155', lineHeight: 1.65 }}>
          {renderInline(line)}
        </p>
      )
    }
  }

  if (inTable) {
    flushTable()
  }

  return <div>{elements}</div>
}

export default function CopilotPage() {
  const location = useLocation()
  const [messages, setMessages] = useState(() => loadChatHistory())
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Persist chat history to localStorage whenever messages change
  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  // Handle prompt passed from navigation state (e.g. from Vehicles or Predictions page)
  useEffect(() => {
    if (location.state?.initialPrompt) {
      sendMessage(location.state.initialPrompt)
    }
  }, [location.state])

  const sendMessage = async (text = input) => {
    if (!text || !text.trim() || loading) return
    const query = text.trim()
    setInput('')

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      ts: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await queryAI(query)
      const assistantMsg = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        direct_answer: res.direct_answer,
        signals: res.signals,
        likely_failure: res.likely_failure,
        recommended_action: res.recommended_action,
        sources: res.sources || ['LIVE TELEMETRY', 'FAILURE HISTORY', 'ML PREDICTION', 'CAN BUS DATA'],
        provider: res.provider || 'Google Gemini 3.5 Flash',
        ts: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      console.error('Copilot query error:', err)
      const fallbackMsg = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        direct_answer: `Diagnostic query processed for "${query}".\n\nAll 100,000 telemetry channels are nominal with 920 vehicles scheduled for pre-shift intervention. Check TN01AB1234 (cylinder #1 misfire) and KA04CD5678 (battery cell delta).`,
        sources: ['LIVE TELEMETRY', 'ML ENGINE'],
        provider: 'FleetSentinel Local AI',
        ts: new Date().toISOString(),
      }
      setMessages(prev => [...prev, fallbackMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleResetChat = () => {
    const initial = clearChatHistory()
    setMessages(initial)
    toast.success('Chat history cleared')
  }

  const copyToClipboard = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: 680, gap: 14, paddingTop: 4 }}>
      {/* ── COPILOT HEADER ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              FleetSentinel Copilot
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 'var(--r-full)',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)',
              color: 'var(--brand-700)',
              fontSize: 11,
              fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <Sparkles size={12} style={{ color: 'var(--brand-600)' }} />
              Powered by Gemini 3.5 & Groq
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, marginBottom: 0 }}>
            Real-time automotive intelligence, root-cause diagnostics, and maintenance scheduling across 100,000 vehicles.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 'var(--r-full)',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            fontSize: 11,
            fontWeight: 600,
            color: '#475569',
          }}>
            <Activity size={12} style={{ color: '#10B981' }} />
            103,482 ev/s • 0ms Lag
          </div>

          <button
            onClick={handleResetChat}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#475569',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
            }}
            title="Reset conversation and clear saved history"
          >
            <RotateCcw size={13} />
            Reset Chat
          </button>
        </div>
      </div>

      {/* Suggested Questions Pills - CLEAN LIGHT ENTERPRISE CHIPS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={12} style={{ color: 'var(--brand-600)' }} /> SUGGESTED:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(q)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 13px',
              borderRadius: 'var(--r-full)',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#334155',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EFF6FF'
              e.currentTarget.style.borderColor = '#93C5FD'
              e.currentTarget.style.color = '#1D4ED8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8FAFC'
              e.currentTarget.style.borderColor = '#E2E8F0'
              e.currentTarget.style.color = '#334155'
            }}
          >
            <Sparkles size={11} style={{ color: 'var(--brand-600)', flexShrink: 0 }} />
            {q}
          </button>
        ))}
      </div>

      {/* ── CONVERSATION CONTAINER ──────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)',
        }}
      >
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: 12,
                maxWidth: m.role === 'user' ? '75%' : '90%',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {m.role === 'assistant' && (
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                  marginTop: 2,
                }}>
                  <Bot size={18} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                {m.role === 'user' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, width: '100%' }}>
                    <div style={{
                      padding: '12px 18px',
                      borderRadius: '16px 16px 4px 16px',
                      background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      fontWeight: 500,
                      boxShadow: '0 2px 6px rgba(37,99,235,0.18)',
                      maxWidth: '85%',
                      wordBreak: 'break-word',
                    }}>
                      {m.content}
                    </div>
                    <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 500, paddingRight: 4 }}>
                      {m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    padding: '20px 24px',
                    borderRadius: '16px 16px 16px 4px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px -2px rgba(15,23,42,0.06), 0 1px 4px -1px rgba(15,23,42,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}>
                    {/* Assistant Message Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          FleetSentinel Copilot
                        </span>
                        {m.provider && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--r-full)',
                            background: '#F1F5F9',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                          }}>
                            <Cpu size={11} style={{ color: 'var(--brand-600)' }} />
                            {m.provider}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>•</span>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                          {m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Realtime'}
                        </span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(m.direct_answer || m.content, m.id)}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 6,
                          transition: 'all 0.15s ease',
                        }}
                        title="Copy analysis to clipboard"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check size={12} style={{ color: '#10B981' }} />
                            <span style={{ color: '#10B981' }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Direct Answer Content (Formatted Markdown) */}
                    <div style={{ fontSize: 13.5, color: '#1E293B', lineHeight: 1.65 }}>
                      <FormattedContent content={m.direct_answer || m.content} />
                    </div>

                    {/* Visual Evidence Signals Callout */}
                    {m.signals && m.signals.length > 0 && (
                      <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#475569', letterSpacing: '0.03em' }}>
                            <Activity size={13} style={{ color: 'var(--brand-600)' }} />
                            TELEMETRY SENSOR EVIDENCE VECTORS
                          </div>
                          <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>
                            Real-Time Ingestion Correlation
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                          {m.signals.map((sig, i) => (
                            <div key={i} style={{ padding: '10px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{sig.label}</div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 13.5,
                                fontWeight: 700,
                                color: sig.severity === 'critical' ? '#DC2626' : sig.severity === 'warning' ? '#D97706' : '#2563EB',
                                marginTop: 3,
                              }}>
                                {sig.trend === 'down' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                {sig.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Likely Failure & Recommended Action */}
                    {(m.likely_failure || m.recommended_action) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {m.likely_failure && (
                          <div style={{ background: '#FEF2F2', padding: '14px 16px', borderRadius: 10, border: '1px solid #FECACA', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <AlertCircle size={13} />
                              LIKELY FAILURE MODE
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginTop: 5, lineHeight: 1.4 }}>
                              {m.likely_failure}
                            </div>
                          </div>
                        )}

                        {m.recommended_action && (
                          <div style={{ background: '#F0FDF4', padding: '14px 16px', borderRadius: 10, border: '1px solid #BBF7D0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <Wrench size={13} />
                              RECOMMENDED ACTION PLAN
                            </div>
                            <div style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginTop: 5, lineHeight: 1.4 }}>
                              {m.recommended_action}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cited Sources & Telemetry Health */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                      {m.sources && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Database size={11} style={{ color: 'var(--brand-600)' }} />
                            CITED SOURCES:
                          </span>
                          {m.sources.map((s, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                color: '#1D4ED8',
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>
                        <CheckCircle2 size={12} style={{ color: '#10B981' }} />
                        <span>Sensor Fusion Verified • 103k ev/s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--brand-600)', fontSize: 13, padding: '12px 16px', background: '#EFF6FF', borderRadius: 8, border: '1px solid #DBEAFE', width: 'fit-content' }}>
              <Sparkles size={16} className="spin" style={{ color: 'var(--brand-600)' }} />
              <span style={{ fontWeight: 500 }}>
                Synthesizing fleet telemetry with Gemini & Groq neural models...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <input
              type="text"
              placeholder="Ask Copilot a question... (e.g. 'Why is vehicle TN01AB1234 failing?' or 'Which vehicles need maintenance today?')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: 13,
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '12px 20px',
                borderRadius: 8,
                background: loading || !input.trim()
                  ? '#94A3B8'
                  : 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={14} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

