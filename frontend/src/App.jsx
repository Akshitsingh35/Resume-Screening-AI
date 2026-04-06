import { useState } from 'react'
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileText,
  Layers3,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react'
import './App.css'

const views = [
  { id: 'studio', label: 'Screening Studio' },
  { id: 'pipeline', label: 'Agent Pipeline' },
  { id: 'about', label: 'Platform Story' },
]

const pipelineSteps = [
  {
    id: 1,
    label: 'Multimodal Intake',
    desc: 'PDFs, DOCX files, and screenshots are normalized before the model touches them.',
    icon: Upload,
  },
  {
    id: 2,
    label: 'Resume Intelligence',
    desc: 'Experience, tools, seniority, and outcomes are extracted into a comparable structure.',
    icon: FileText,
  },
  {
    id: 3,
    label: 'Role Deconstruction',
    desc: 'The job description is parsed into requirements, signals, and likely hiring thresholds.',
    icon: Briefcase,
  },
  {
    id: 4,
    label: 'Decision Engine',
    desc: 'A matching pass returns score, confidence, recommendation, and review guidance.',
    icon: Target,
  },
]

const productNotes = [
  {
    icon: Sparkles,
    title: 'Focused experience',
    text: 'Clear hierarchy and cleaner composition keep the workflow easy to follow from upload to decision.',
  },
  {
    icon: ShieldCheck,
    title: 'Human review stays visible',
    text: 'The interface keeps risk, confidence, and edge-case handling explicit so this does not feel like a black-box toy.',
  },
  {
    icon: Layers3,
    title: 'Motion and depth',
    text: 'Ambient animation, layered surfaces, and staged reveals add energy while keeping the content readable.',
  },
]

function App() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const [activeView, setActiveView] = useState('studio')

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']
    const ext = `.${selectedFile.name.split('.').pop().toLowerCase()}`

    if (!validTypes.includes(ext)) {
      setError('Invalid file type. Please upload PDF, DOCX, or image files.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const handleSubmit = async () => {
    if (!file || jobDescription.trim().length < 20) {
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('job_description', jobDescription)

      const response = await fetch('/api/screen', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'An error occurred')
      }

      setResult(data)
      setActiveView('studio')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = file && jobDescription.trim().length >= 20 && !isLoading

  const getRecommendationStyle = (recommendation) => {
    if (!recommendation) {
      return {
        icon: AlertCircle,
        color: 'warning',
        text: 'Awaiting analysis',
      }
    }

    const lower = recommendation.toLowerCase()

    if (lower.includes('proceed') || lower.includes('interview')) {
      return {
        icon: CheckCircle2,
        color: 'success',
        text: 'Proceed to interview',
      }
    }

    if (lower.includes('reject')) {
      return {
        icon: XCircle,
        color: 'error',
        text: 'Reject',
      }
    }

    return {
      icon: AlertCircle,
      color: 'warning',
      text: 'Needs manual review',
    }
  }

  const recommendation = getRecommendationStyle(result?.recommendation)
  const heroMatch = result ? `${Math.round((result.match_score || 0) * 100)}%` : '91%'
  const heroConfidence = result ? `${Math.round((result.confidence || 0) * 100)}%` : '94%'
  const heroReview = result ? (result.requires_human ? 'Required' : 'Optional') : 'Guarded'

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />
      <div className="mesh-grid" />
      <div className="noise-overlay" />
      <div className="top-halo" />

      <header className="site-header">
        <motion.div
          className="site-header-inner"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="brand-lockup">
            <div className="brand-mark">
              <Brain />
            </div>
            <div>
              <div className="brand-eyebrow">Resume Screening AI</div>
              <div className="brand-subtitle">Candidate matching workspace</div>
            </div>
          </div>

          <div className="header-pills">
            <span className="header-pill">LangChain</span>
            <span className="header-pill">LangGraph</span>
            <span className="header-pill">Gemini</span>
            <span className="header-pill header-pill-accent">Multi-Agent</span>
          </div>
        </motion.div>
      </header>

      <main className="page-content">
        <section className="hero-section">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="eyebrow-pill">
              <Sparkles />
              <span>Hiring intelligence for modern teams</span>
            </div>

            <h1>
              Screen resumes with
              <span className="headline-spotlight"> speed, clarity, and confidence.</span>
            </h1>

            <p className="hero-description">
              Upload a resume, add the job description, and get a structured recommendation with
              match score, confidence, and review guidance.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="primary-cta"
                onClick={() => setActiveView('studio')}
              >
                <span>Open screening studio</span>
                <ArrowRight />
              </button>
              <button
                type="button"
                className="secondary-cta"
                onClick={() => setActiveView('pipeline')}
              >
                <Workflow />
                <span>Explore the pipeline</span>
              </button>
            </div>

            <div className="hero-strip">
              <div>
                <span className="strip-label">Ambient motion</span>
                <strong>Scene-lit surfaces</strong>
              </div>
              <div>
                <span className="strip-label">Operational focus</span>
                <strong>Upload, analyze, decide</strong>
              </div>
              <div>
                <span className="strip-label">Output</span>
                <strong>Score, confidence, reasoning</strong>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-stage"
            initial={{ opacity: 0, scale: 0.96, y: 36 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
          >
            <motion.div
              className="hero-stage-card"
              animate={{ y: [0, -10, 0], rotateX: [0, 1.2, 0], rotateY: [0, -1.8, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="stage-topbar">
                <span className="stage-dot" />
                <span className="stage-dot" />
                <span className="stage-dot" />
              </div>

              <div className="stage-headline">
                <div>
                  <span className="stage-label">Live match preview</span>
                  <h2>Candidate analysis overview</h2>
                </div>
                <span className={`signal-pill signal-${recommendation.color}`}>
                  {recommendation.text}
                </span>
              </div>

              <div className="stage-score-grid">
                <div className="score-panel score-panel-main">
                  <span className="score-kicker">Match score</span>
                  <strong>{heroMatch}</strong>
                  <div className="score-bar">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: heroMatch }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div className="score-panel">
                  <span className="score-kicker">Confidence</span>
                  <strong>{heroConfidence}</strong>
                  <p>Measured against the extracted role requirements.</p>
                </div>
                <div className="score-panel">
                  <span className="score-kicker">Human review</span>
                  <strong>{heroReview}</strong>
                  <p>Escalates gracefully when the model sees ambiguity.</p>
                </div>
              </div>

              <div className="signal-rail">
                <div className="signal-line signal-line-a" />
                <div className="signal-line signal-line-b" />
                <div className="signal-line signal-line-c" />
              </div>

                <div className="floating-stat floating-stat-a">
                  <span>4-stage system</span>
                  <strong>Multimodal to match</strong>
                </div>
              <div className="floating-stat floating-stat-b">
                <span>Latency posture</span>
                <strong>{isLoading ? 'Analyzing live' : 'Ready for next run'}</strong>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <LayoutGroup>
          <section className="control-surface">
            <div className="surface-header">
              <div>
                <span className="section-kicker">Control center</span>
                <h2>One interface for screening, inspection, and decision support</h2>
              </div>

              <div className="tab-switcher">
                {views.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    className={`tab-pill ${activeView === view.id ? 'active' : ''}`}
                    onClick={() => setActiveView(view.id)}
                  >
                    {activeView === view.id && (
                      <motion.span
                        layoutId="active-tab-pill"
                        className="tab-pill-bg"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="tab-pill-label">{view.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeView === 'studio' && (
                <motion.div
                  key="studio"
                  className="studio-layout"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <div className="studio-intro panel">
                    <div className="panel-badge">
                      <Zap />
                      <span>Screening workflow</span>
                    </div>

                    <h3>Drag in a resume, paste the role, and let the system stage a decision.</h3>
                    <p>
                      Add candidate material and role context, then run the pipeline to generate a
                      structured screening result.
                    </p>

                    <div className="intro-metrics">
                      <div className="intro-metric">
                        <span>Accepted formats</span>
                        <strong>PDF, DOCX, PNG, JPG</strong>
                      </div>
                      <div className="intro-metric">
                        <span>Max upload size</span>
                        <strong>10 MB</strong>
                      </div>
                      <div className="intro-metric">
                        <span>Decision payload</span>
                        <strong>Score + confidence + review</strong>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    className="panel upload-panel"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05, duration: 0.45 }}
                  >
                    <div className="panel-header">
                      <div className="panel-title">
                        <Upload />
                        <div>
                          <h3>Resume intake</h3>
                          <p>Drop candidate material into the analysis queue.</p>
                        </div>
                      </div>
                      <span className="panel-tag">Step 01</span>
                    </div>

                    <motion.div
                      className={`upload-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('file-input')?.click()}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <input
                        id="file-input"
                        type="file"
                        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                        hidden
                        onChange={(event) => {
                          if (event.target.files[0]) {
                            validateAndSetFile(event.target.files[0])
                          }
                        }}
                      />

                      <AnimatePresence mode="wait">
                        {file ? (
                          <motion.div
                            key="file"
                            className="upload-content"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                          >
                            <CheckCircle2 className="upload-icon success" />
                            <strong>{file.name}</strong>
                            <span>{(file.size / 1024).toFixed(1)} KB ready for parsing</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="prompt"
                            className="upload-content"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                          >
                            <Upload className="upload-icon" />
                            <strong>Drop a resume into the spotlight</strong>
                            <span>Or click to browse your files</span>
                            <small>Supports PDF, DOCX, DOC, PNG, JPG, JPEG</small>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="panel jd-panel"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08, duration: 0.45 }}
                  >
                    <div className="panel-header">
                      <div className="panel-title">
                        <Briefcase />
                        <div>
                          <h3>Job description</h3>
                          <p>Give the system enough context to score the fit properly.</p>
                        </div>
                      </div>
                      <span className="panel-tag">Step 02</span>
                    </div>

                    <textarea
                      className="jd-input"
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      placeholder={`Paste the hiring brief here.\n\nExample:\nSenior software engineer\n- Python and backend API experience\n- Cloud infrastructure and deployment knowledge\n- Strong communication and ownership\n- Experience building reliable production systems`}
                    />

                    <div className="jd-footer">
                      <span className="char-count">
                        {jobDescription.length} characters
                        {jobDescription.length < 20 ? ' · minimum 20 required' : ' · ready to analyze'}
                      </span>
                      <span className="helper-pill">Structured requirement extraction</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeView === 'pipeline' && (
                <motion.div
                  key="pipeline"
                  className="pipeline-layout"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <div className="pipeline-intro panel">
                    <span className="section-kicker">System choreography</span>
                    <h3>A four-part agent flow with clear progression across the screening pipeline.</h3>
                    <p>
                      Each stage handles a focused task, from file intake through matching and final
                      recommendation.
                    </p>
                  </div>

                  <div className="pipeline-grid">
                    {pipelineSteps.map((step, index) => {
                      const Icon = step.icon
                      const isCompleted = Boolean(result)
                      const isActive = isLoading || isCompleted

                      return (
                        <motion.div
                          key={step.id}
                          className={`pipeline-card ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.07, duration: 0.4 }}
                        >
                          <div className="pipeline-card-top">
                            <div className="pipeline-icon-shell">
                              <Icon />
                            </div>
                            <span className="pipeline-number">0{step.id}</span>
                          </div>
                          <h4>{step.label}</h4>
                          <p>{step.desc}</p>
                          <div className="pipeline-status">
                            <span className="status-dot" />
                            <span>
                              {isCompleted ? 'Completed' : isActive ? 'In motion' : 'Waiting for input'}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {activeView === 'about' && (
                <motion.div
                  key="about"
                  className="about-layout"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <div className="about-lead panel">
                    <span className="section-kicker">Platform overview</span>
                    <h3>Built to make resume screening faster, clearer, and easier to review.</h3>
                    <p>
                      The platform combines structured analysis, visible decision signals, and a clean
                      workflow so teams can evaluate candidates with more context.
                    </p>
                  </div>

                  <div className="about-grid">
                    {productNotes.map((note, index) => {
                      const Icon = note.icon
                      return (
                        <motion.div
                          key={note.title}
                          className="about-card panel"
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08, duration: 0.4 }}
                        >
                          <div className="about-icon-shell">
                            <Icon />
                          </div>
                          <h4>{note.title}</h4>
                          <p>{note.text}</p>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </LayoutGroup>

        {activeView === 'studio' && (
          <motion.div
            className="submit-wrap"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45 }}
          >
            <button
              type="button"
              className={`analyze-button ${isLoading ? 'loading' : ''}`}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              <span className="button-shine" />
              {isLoading ? (
                <>
                  <Loader2 className="spinner" />
                  <span>Analyzing candidate fit...</span>
                </>
              ) : (
                <>
                  <Zap />
                  <span>Run screening flow</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              className="alert-banner"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
            >
              <AlertCircle />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.section
              className="results-panel"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 160, damping: 24 }}
            >
              <div className={`results-hero ${recommendation.color}`}>
                <div className="results-headline">
                  <span className="section-kicker">Decision output</span>
                  <h2>
                    {(() => {
                      const RecommendationIcon = recommendation.icon
                      return (
                        <>
                          <RecommendationIcon />
                          <span>{recommendation.text}</span>
                        </>
                      )
                    })()}
                  </h2>
                  <p>{result.reasoning_summary}</p>
                </div>

                <div className="results-score-ring">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" className="score-bg" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="score-fill"
                      initial={{ strokeDashoffset: 327 }}
                      animate={{ strokeDashoffset: 327 - 327 * (result.match_score || 0) }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                    />
                  </svg>
                  <strong>{Math.round((result.match_score || 0) * 100)}%</strong>
                  <span>match</span>
                </div>
              </div>

              <div className="results-metrics">
                <motion.div
                  className="result-metric"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <Target />
                  <div>
                    <span>Match score</span>
                    <strong>{Math.round((result.match_score || 0) * 100)}%</strong>
                  </div>
                </motion.div>

                <motion.div
                  className="result-metric"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 }}
                >
                  <TrendingUp />
                  <div>
                    <span>Confidence</span>
                    <strong>{Math.round((result.confidence || 0) * 100)}%</strong>
                  </div>
                </motion.div>

                <motion.div
                  className="result-metric"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Brain />
                  <div>
                    <span>Human review</span>
                    <strong>{result.requires_human ? 'Required' : 'Optional'}</strong>
                  </div>
                </motion.div>
              </div>

              <div className="results-bottom">
                <div className="reasoning-panel">
                  <div className="panel-title-inline">
                    <Sparkles />
                    <span>Reasoning summary</span>
                  </div>
                  <p>{result.reasoning_summary}</p>
                </div>

                <div className="json-panel">
                  <button
                    type="button"
                    className="json-toggle"
                    onClick={() => setShowJson((current) => !current)}
                  >
                    <Code2 />
                    <span>{showJson ? 'Hide raw response' : 'Show raw response'}</span>
                    <ChevronDown className={showJson ? 'rotated' : ''} />
                  </button>

                  <AnimatePresence>
                    {showJson && (
                      <motion.pre
                        className="json-output"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {JSON.stringify(result, null, 2)}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="site-footer">
        <p>Powered by LangChain, LangGraph, and Gemini.</p>
      </footer>
    </div>
  )
}

export default App
