import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─── Mermaid renderer ───────────────────────────────────────────────────────
function MermaidDiagram({ chart, title }) {
  const ref = useRef(null)
  const [svg, setSvg] = useState('')
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mermaid = (await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs')).default
        mermaid.initialize({ startOnLoad: false, theme: 'dark', themeVariables: { primaryColor: '#00ff9f', edgeLabelBackground: '#0d0d0d', tertiaryColor: '#0d0d0d' } })
        const id = 'mmd-' + Math.random().toString(36).slice(2)
        const { svg: rendered } = await mermaid.render(id, chart)
        if (!cancelled) setSvg(rendered)
      } catch (e) {
        if (!cancelled) setErr(true)
      }
    }
    render()
    return () => { cancelled = true }
  }, [chart])

  if (err) return (
    <div className="diagram-error">
      <span className="glitch">RENDER_ERROR</span>
      <pre className="diagram-raw">{chart}</pre>
    </div>
  )
  if (!svg) return <div className="diagram-loading"><div className="scan-bar" /></div>

  return (
    <div className="diagram-wrap" ref={ref}>
      <div className="diagram-header">
        <span className="diagram-type-badge">{title}</span>
      </div>
      <div className="diagram-svg" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ progress, message }) {
  // Milestones for segment labels
  const milestones = [
    { pct: 25,  label: 'CLONE' },
    { pct: 50,  label: 'UNDERSTAND' },
    { pct: 75,  label: 'DIAGRAMS' },
    { pct: 100, label: 'COMPLETE' },
  ]

  return (
    <div className="progress-zone">
      {/* Percentage + message */}
      <div className="progress-header">
        <span className="progress-pct">{progress}%</span>
        <span className="progress-msg">
          <span className="loading-prefix">{'>'}&nbsp;</span>
          <span className="loading-text">{message}</span>
          <ProgressDots />
        </span>
      </div>

      {/* Main bar */}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
        {/* Milestone markers */}
        {milestones.map(m => (
          <div
            key={m.pct}
            className={`progress-marker ${progress >= m.pct ? 'reached' : ''}`}
            style={{ left: `${m.pct}%` }}
          >
            <div className="marker-dot" />
            <div className="marker-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Stage indicators */}
      <div className="stage-row">
        {milestones.map((m, i) => {
          const prevPct = i === 0 ? 0 : milestones[i - 1].pct
          const active = progress > prevPct && progress <= m.pct
          const done = progress > m.pct
          return (
            <div key={m.pct} className={`stage-box ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              <span className="stage-num">0{i + 1}</span>
              <span className="stage-label">{m.label}</span>
              {done && <span className="stage-check">✓</span>}
              {active && <span className="stage-spinner" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProgressDots() {
  const [dots, setDots] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400)
    return () => clearInterval(t)
  }, [])
  return <span className="loading-dots">{'·'.repeat(dots)}</span>
}

// ─── DNA Helix Loading Animation (kept for fallback / aesthetic) ─────────────
function DNALoader() {
  const messages = [
    'CLONING REPOSITORY...',
    'SCANNING FILE TREE...',
    'DETECTING TECH STACK...',
    'RUNNING AI ANALYSIS...',
    'GENERATING DIAGRAMS...',
    'DECODING ARCHITECTURE...',
    'MAPPING DEPENDENCIES...',
    'SYNTHESIZING INTELLIGENCE...',
  ]
  const [msgIdx, setMsgIdx] = useState(0)
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const t1 = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 2200)
    const t2 = setInterval(() => setDots(d => (d + 1) % 4), 400)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const helixCount = 12
  return (
    <div className="dna-scene">
      <div className="dna-helix">
        {Array.from({ length: helixCount }).map((_, i) => (
          <div key={i} className="dna-rung" style={{ '--i': i, '--total': helixCount }}>
            <div className="dna-node left" style={{ '--delay': `${i * 0.08}s` }} />
            <div className="dna-bridge" style={{ '--delay': `${i * 0.08}s` }} />
            <div className="dna-node right" style={{ '--delay': `${i * 0.08}s` }} />
          </div>
        ))}
      </div>
      <div className="dna-glow-ring" />
      <div className="loading-msg">
        <span className="loading-prefix">{'>'}&nbsp;</span>
        <span className="loading-text">{messages[msgIdx]}</span>
        <span className="loading-dots">{'·'.repeat(dots)}</span>
      </div>
      <div className="loading-bar-wrap">
        <div className="loading-bar-fill" />
      </div>
    </div>
  )
}

// ─── Typewriter text ─────────────────────────────────────────────────────────
function Typewriter({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    if (!text) return
    let i = 0
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(t)
    }, speed)
    return () => clearInterval(t)
  }, [text])
  return <span>{displayed}<span className="cursor-blink">█</span></span>
}

// ─── Badge ───────────────────────────────────────────────────────────────────
function Badge({ label }) {
  return <span className="badge">{label}</span>
}

// ─── Score Badge ─────────────────────────────────────────────────────────────
function ScoreBadge({ label, value, max = 100 }) {
  const pct = (value / max) * 100
  let color = pct >= 75 ? '#00ff9f' : pct >= 50 ? '#ffaa00' : '#ff4444'
  return (
    <div className="score-badge">
      <div className="score-label">{label}</div>
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="score-value">{Math.round(value)}/100</div>
    </div>
  )
}

// ─── Expandable Section ──────────────────────────────────────────────────────
function ExpandableSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="expandable-section">
      <div className="expandable-header" onClick={() => setOpen(!open)}>
        <span className="expand-icon">{open ? '▼' : '▶'}</span>
        <span className="expand-title">{title}</span>
      </div>
      {open && <div className="expandable-content">{children}</div>}
    </div>
  )
}

// ─── Results Panel ───────────────────────────────────────────────────────────
function Results({ data }) {
  const u = data.aiAnalysis?.project_understanding
  const diagrams = data.aiAnalysis?.diagrams?.diagrams || []
  const analysis = data.analysis || {}
  const visualizations = data.visualizations || {}
  const summary = data.summary || {}

  const codeQuality = analysis.codeQuality?.codeQuality || {}
  const security = analysis.security?.security || {}
  const gitHealth = analysis.gitHealth?.gitHealth || {}
  const performance = analysis.performance?.performance || {}
  const maturity = analysis.projectMaturity?.projectMaturity || {}

  return (
    <div className="results-panel">
      {/* Header bar */}
      <div className="result-header">
        <div className="result-status">
          <span className="status-dot" />
          ANALYSIS COMPLETE
        </div>
        {data.cached && <span className="cached-badge">CACHED</span>}
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-value">{data.totalFiles}</div>
          <div className="stat-label">FILES</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{data.languages?.length}</div>
          <div className="stat-label">LANGUAGES</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{data.techStack?.length}</div>
          <div className="stat-label">TECHNOLOGIES</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{diagrams.length}</div>
          <div className="stat-label">DIAGRAMS</div>
        </div>
      </div>

      {/* Overall Health Score */}
      {summary.overallHealthScore !== undefined && (
        <div className="section">
          <div className="section-label">▸ 🎯 OVERALL HEALTH SCORE</div>
          <div className="health-summary">
            <div className="health-main">
              <div className="health-score">{Math.round(summary.overallHealthScore)}%</div>
              <div className="health-status">{summary.status || 'Analyzing...'}</div>
            </div>
            <div className="health-details">
              {summary.keyInsights?.slice(0, 3).map((insight, i) => (
                <div key={i} className="insight-item">✓ {insight}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tech stack badges */}
      <div className="section">
        <div className="section-label">▸ TECH STACK</div>
        <div className="badge-row">
          {data.techStack?.map(t => <Badge key={t} label={t} />)}
          {data.languages?.map(l => <Badge key={l} label={l.toUpperCase()} />)}
        </div>
      </div>

      {/* Project summary */}
      {u?.project_summary && (
        <div className="section">
          <div className="section-label">▸ PROJECT SUMMARY</div>
          <div className="summary-box">
            <Typewriter text={u.project_summary} speed={12} />
          </div>
        </div>
      )}

      {/* Architecture */}
      {u?.architecture && (
        <div className="section">
          <div className="section-label">▸ ARCHITECTURE</div>
          <div className="summary-box arch">{u.architecture}</div>
        </div>
      )}

      {/* Analysis Scores Row */}
      {(codeQuality.score !== undefined || security.score !== undefined || gitHealth.healthScore !== undefined || performance.healthScore !== undefined) && (
        <div className="section">
          <div className="section-label">▸ ANALYSIS SCORES</div>
          <div className="scores-grid">
            {codeQuality.score !== undefined && <ScoreBadge label="Code Quality" value={codeQuality.score} />}
            {security.score !== undefined && <ScoreBadge label="Security" value={security.score} />}
            {gitHealth.healthScore !== undefined && <ScoreBadge label="Git Health" value={gitHealth.healthScore} />}
            {performance.healthScore !== undefined && <ScoreBadge label="Performance" value={performance.healthScore} />}
          </div>
        </div>
      )}

      {/* Code Quality Details */}
      {codeQuality.score !== undefined && (
        <ExpandableSection title={`📊 Code Quality (${Math.round(codeQuality.score)}/100)`}>
          <div className="detail-box">
            {codeQuality.complexity && <div className="detail-line"><strong>Avg Complexity:</strong> {codeQuality.complexity.average?.toFixed(2)}</div>}
            {codeQuality.duplication && <div className="detail-line"><strong>Duplication:</strong> {codeQuality.duplication}%</div>}
            {codeQuality.commentDensity && <div className="detail-line"><strong>Comment Density:</strong> {codeQuality.commentDensity}%</div>}
            {codeQuality.codeSmells?.length > 0 && (
              <div className="detail-line">
                <strong>Issues Found:</strong> {codeQuality.codeSmells.length}
              </div>
            )}
          </div>
        </ExpandableSection>
      )}

      {/* Security Details */}
      {security.score !== undefined && (
        <ExpandableSection title={`🔒 Security (${Math.round(security.score)}/100)`}>
          <div className="detail-box">
            {security.secretsFound?.length > 0 && (
              <div className="detail-line alert-danger">
                ⚠️ <strong>{security.secretsFound.length} Hardcoded Secrets Found</strong>
              </div>
            )}
            {security.vulnerabilities?.length > 0 && (
              <div className="detail-line alert-danger">
                ⚠️ <strong>{security.vulnerabilities.length} Vulnerable Packages</strong>
              </div>
            )}
            {security.outdatedPackages?.length > 0 && (
              <div className="detail-line alert-warning">
                ⚠️ <strong>{security.outdatedPackages.length} Outdated Packages</strong>
              </div>
            )}
            {security.riskLevel && <div className="detail-line"><strong>Risk Level:</strong> {security.riskLevel}</div>}
          </div>
        </ExpandableSection>
      )}

      {/* Git Health Details */}
      {gitHealth.healthScore !== undefined && (
        <ExpandableSection title={`📈 Git Health (${Math.round(gitHealth.healthScore)}/100)`}>
          <div className="detail-box">
            {gitHealth.commits && <div className="detail-line"><strong>Total Commits:</strong> {gitHealth.commits}</div>}
            {gitHealth.contributors && <div className="detail-line"><strong>Contributors:</strong> {gitHealth.contributors}</div>}
            {gitHealth.frequency && <div className="detail-line"><strong>Activity:</strong> {gitHealth.frequency}</div>}
            {gitHealth.branchStrategy && <div className="detail-line"><strong>Branch Strategy:</strong> {gitHealth.branchStrategy}</div>}
          </div>
        </ExpandableSection>
      )}

      {/* Performance Details */}
      {performance.healthScore !== undefined && (
        <ExpandableSection title={`⚡ Performance (${Math.round(performance.healthScore)}/100)`}>
          <div className="detail-box">
            {performance.bundleSize && <div className="detail-line"><strong>Bundle Size:</strong> {(performance.bundleSize / 1024 / 1024).toFixed(2)} MB</div>}
            {performance.largeFiles?.length > 0 && (
              <div className="detail-line"><strong>Large Files:</strong> {performance.largeFiles.length} files</div>
            )}
            {performance.unusedDependencies?.length > 0 && (
              <div className="detail-line alert-warning"><strong>Unused Dependencies:</strong> {performance.unusedDependencies.length}</div>
            )}
            {performance.avgImportDepth && <div className="detail-line"><strong>Avg Import Depth:</strong> {performance.avgImportDepth.toFixed(1)}</div>}
          </div>
        </ExpandableSection>
      )}

      {/* Project Maturity */}
      {maturity.overallScore !== undefined && (
        <ExpandableSection title={`🏆 Project Maturity (${Math.round(maturity.overallScore)}/100)`}>
          <div className="detail-box">
            {maturity.level && <div className="detail-line"><strong>Maturity Level:</strong> {maturity.level}</div>}
            {maturity.hasTests && <div className="detail-line">✓ Has Tests</div>}
            {maturity.hasCICD && <div className="detail-line">✓ Has CI/CD</div>}
            {maturity.hasDocumentation && <div className="detail-line">✓ Has Documentation</div>}
            {maturity.hasLicense && <div className="detail-line">✓ Has License</div>}
            {maturity.hasChangelog && <div className="detail-line">✓ Has Changelog</div>}
          </div>
        </ExpandableSection>
      )}

      {/* Diagrams */}
      {diagrams.length > 0 && (
        <div className="section">
          <div className="section-label">▸ AI-GENERATED DIAGRAMS</div>
          <div className="diagrams-grid">
            {diagrams.map((d, i) => (
              <MermaidDiagram key={i} chart={d.mermaid} title={`${d.type} · ${d.name}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [focused, setFocused] = useState(false)
  const esRef = useRef(null)

  // Clean up SSE on unmount
  useEffect(() => () => esRef.current?.close(), [])

  async function analyze() {
    if (!url.trim()) return

    // Close any existing SSE connection
    esRef.current?.close()

    setLoading(true)
    setData(null)
    setError(null)
    setProgress(0)
    setProgressMsg('CONNECTING...')

    const encodedUrl = encodeURIComponent(url.trim())
    const sseUrl = `http://localhost:5000/analyze-repo-stream?url=${encodedUrl}`

    const es = new EventSource(sseUrl)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)

        if (payload.progress === -1) {
          // Error from server
          setError(payload.message || 'Server error')
          setLoading(false)
          es.close()
          return
        }

        if (payload.progress === 100 && payload.result) {
          // Final result
          setProgress(100)
          setProgressMsg(payload.message || 'COMPLETE')
          // Small delay so user sees 100%
          setTimeout(() => {
            setData(payload.result)
            setLoading(false)
          }, 600)
          es.close()
          return
        }

        // Intermediate progress
        setProgress(payload.progress ?? 0)
        setProgressMsg(payload.message ?? '')
      } catch (err) {
        console.error('SSE parse error', err)
      }
    }

    es.onerror = () => {
      setError('Connection to server lost. Is the backend running?')
      setLoading(false)
      es.close()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') analyze()
  }

  return (
    <div className="app">
      {/* Scanline overlay */}
      <div className="scanlines" aria-hidden="true" />
      {/* Ambient grid */}
      <div className="grid-bg" aria-hidden="true" />

      {/* ── Hero ── */}
      <header className="hero-section">
        <div className="logo-block">
          <div className="logo-icon">
            <span className="logo-bracket">[</span>
            <span className="logo-eye">⬡</span>
            <span className="logo-bracket">]</span>
          </div>
          <div className="logo-text">
            <span className="logo-repo">REPO</span><span className="logo-lens">LENS</span>
          </div>
        </div>
        <p className="hero-sub">AI-powered repository intelligence · powered by local LLM</p>
      </header>

      {/* ── Input ── */}
      <div className={`input-zone ${focused ? 'input-zone--focused' : ''}`}>
        <div className="input-prefix">git@</div>
        <input
          className="repo-input"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="https://github.com/user/repo.git"
          disabled={loading}
          spellCheck={false}
        />
        <button
          className={`analyze-btn ${loading ? 'analyze-btn--loading' : ''}`}
          onClick={analyze}
          disabled={loading || !url.trim()}
        >
          {loading ? '...' : 'ANALYZE →'}
        </button>
      </div>

      {/* ── Loading: DNA helix + progress bar side by side ── */}
      {loading && (
        <div className="loading-zone loading-zone--split">
          <DNALoader />
          <ProgressBar progress={progress} message={progressMsg} />
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="error-box">
          <span className="error-icon">✖</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      {data && !loading && <Results data={data} />}

      {/* ── Empty state ── */}
      {!data && !loading && !error && (
        <div className="empty-state">
          <div className="empty-grid">
            {['SCAN', 'PARSE', 'ANALYZE', 'DIAGRAM'].map((s, i) => (
              <div key={s} className="empty-card" style={{ '--card-delay': `${i * 0.15}s` }}>
                <div className="empty-card-num">0{i + 1}</div>
                <div className="empty-card-label">{s}</div>
              </div>
            ))}
          </div>
          <p className="empty-hint">Paste any public GitHub URL above and press ANALYZE</p>
        </div>
      )}
    </div>
  )
}