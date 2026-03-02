import { useState, useCallback } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { 
  Upload, FileText, Briefcase, Sparkles, CheckCircle2, 
  XCircle, AlertCircle, ChevronDown, Loader2, Zap,
  Brain, Target, TrendingUp, Code2
} from 'lucide-react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const [activeView, setActiveView] = useState('studio') // 'studio' | 'pipeline' | 'about'

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) validateAndSetFile(droppedFile)
  }, [])

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase()
    
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

  const handleSubmit = async () => {
    if (!file || jobDescription.trim().length < 20) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('job_description', jobDescription)

      const response = await fetch('/api/screen', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'An error occurred')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = file && jobDescription.trim().length >= 20 && !isLoading

  const getRecommendationStyle = (rec) => {
    if (!rec) return { icon: AlertCircle, color: 'warning', text: 'Unknown' }
    const lower = rec.toLowerCase()
    if (lower.includes('proceed') || lower.includes('interview')) {
      return { icon: CheckCircle2, color: 'success', text: 'Proceed to Interview' }
    }
    if (lower.includes('reject')) {
      return { icon: XCircle, color: 'error', text: 'Reject' }
    }
    return { icon: AlertCircle, color: 'warning', text: 'Needs Manual Review' }
  }

  return (
    <div className="app">
      {/* Animated Background */}
      <div className="bg-gradient" />
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="bg-beam beam-1" />
      <div className="bg-beam beam-2" />
      <div className="bg-noise" />
      
      {/* Header */}
      <motion.header 
        className="header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="logo">
            <Brain className="logo-icon" />
            <span>Resume Screening AI</span>
          </div>
          <div className="tech-badges">
            <span className="badge">LangChain</span>
            <span className="badge">LangGraph</span>
            <span className="badge">Gemini</span>
            <span className="badge badge-glow">Multi-Agent</span>
          </div>
        </div>
      </motion.header>

      <main className="main">
        <LayoutGroup>
          {/* Hero + View Switcher */}
          <motion.div 
            className="hero hero-layout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="hero-left">
              <div className="hero-kicker">Multi-Agent Screening Studio</div>
              <h1>
                <Sparkles className="hero-icon" />
                AI that reads resumes like a hiring manager.
              </h1>
              <p>
                Upload a resume, paste a job description, and watch a chain of 
                agents parse, align, and score the match in real time.
              </p>

              <div className="view-switch">
                {[
                  { id: 'studio', label: 'Screening Studio' },
                  { id: 'pipeline', label: 'Agent Pipeline' },
                  { id: 'about', label: 'About the Engine' }
                ].map((view) => (
                  <button
                    key={view.id}
                    className={`view-pill ${activeView === view.id ? 'active' : ''}`}
                    onClick={() => setActiveView(view.id)}
                  >
                    {activeView === view.id && (
                      <motion.span
                        layoutId="pill-bg"
                        className="view-pill-bg"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="view-pill-label">{view.label}</span>
                  </button>
                ))}
              </div>

              <div className="hero-glance">
                <div className="hero-chip">
                  <Loader2 className="chip-icon" />
                  <span>Streaming multi-step analysis</span>
                </div>
                <div className="hero-chip">
                  <Zap className="chip-icon" />
                  <span>Score, confidence & reasoning in one shot</span>
                </div>
              </div>
            </div>

            <motion.div 
              className="hero-right"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <motion.div 
                className="hero-3d-card"
                whileHover={{ rotateX: 8, rotateY: -8, translateY: -8 }}
                transition={{ type: 'spring', stiffness: 160, damping: 18 }}
              >
                <div className="hero-3d-header">
                  <div className="hero-3d-title">
                    <Brain />
                    <span>Live Match Preview</span>
                  </div>
                  <span className="hero-3d-pill">Gemini + LangGraph</span>
                </div>
                <div className="hero-3d-body">
                  <div className="hero-3d-row">
                    <span>Match score</span>
                    <span className="hero-3d-value">
                      {result ? `${Math.round((result.match_score || 0) * 100)}%` : '—'}
                    </span>
                  </div>
                  <div className="hero-3d-row">
                    <span>Confidence</span>
                    <span className="hero-3d-value">
                      {result ? `${Math.round((result.confidence || 0) * 100)}%` : '—'}
                    </span>
                  </div>
                  <div className="hero-3d-row">
                    <span>Human review</span>
                    <span className="hero-3d-tag">
                      {result ? (result.requires_human ? 'Recommended' : 'Optional') : 'Pending'}
                    </span>
                  </div>
                  <div className="hero-3d-sparkline">
                    <span>Agent activity</span>
                    <div className={`sparkline ${isLoading ? 'sparkline-live' : ''}`} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

        {/* Main content views */}
        <AnimatePresence mode="wait">
          {activeView === 'studio' && (
            <motion.div
              key="studio"
              className="grid studio-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {/* Upload Section */}
              <motion.div 
                className="card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="card-header">
                  <FileText className="card-icon" />
                  <h2>Upload Resume</h2>
                </div>
                
                <motion.div
                  className={`upload-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <input
                    type="file"
                    id="file-input"
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                    onChange={(e) => e.target.files[0] && validateAndSetFile(e.target.files[0])}
                    hidden
                  />
                  
                  <AnimatePresence mode="wait">
                    {file ? (
                      <motion.div 
                        className="file-info"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key="file"
                      >
                        <CheckCircle2 className="file-success-icon" />
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="upload-prompt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="prompt"
                      >
                        <Upload className="upload-icon" />
                        <span className="upload-text">Drag & drop your resume</span>
                        <span className="upload-hint">or click to browse</span>
                        <span className="upload-formats">PDF, DOCX, PNG, JPG</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Job Description Section */}
              <motion.div 
                className="card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="card-header">
                  <Briefcase className="card-icon" />
                  <h2>Job Description</h2>
                </div>
                
                <textarea
                  className="jd-input"
                  placeholder="Paste the job description here...

Example:
We are looking for a Software Engineer with:
• 2+ years Python experience
• Knowledge of REST APIs
• Experience with cloud platforms
• Strong problem-solving skills"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                
                <div className="char-count">
                  {jobDescription.length} characters
                  {jobDescription.length < 20 && <span className="char-warning"> (min 20)</span>}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeView === 'pipeline' && (
            <motion.div
              key="pipeline"
              className="pipeline pipeline-expanded"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              {[
                { id: 1, label: 'Agent 1 · File Parser', desc: 'Gemini multimodal reads PDFs, DOCX, and images and extracts clean text.', icon: Upload },
                { id: 2, label: 'Agent 2 · Resume Analyzer', desc: 'Understands skills, experience, and education into a structured schema.', icon: FileText },
                { id: 3, label: 'Agent 3 · JD Analyzer', desc: 'Dissects the job requirements, seniority, and tech stack.', icon: Briefcase },
                { id: 4, label: 'Agent 4 · Matching Agent', desc: 'Aligns candidate vs role and returns match score + reasoning.', icon: Target }
              ].map((step, index) => {
                const Icon = step.icon
                const isActive = isLoading || !!result
                const isCompleted = !!result
                return (
                  <motion.div
                    key={step.id}
                    className={`pipeline-step pipeline-step-large ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                  >
                    <div className="pipeline-icon-wrap">
                      <Icon className="pipeline-icon" />
                      <span className="pipeline-step-number">{step.id}</span>
                    </div>
                    <div className="pipeline-text">
                      <span className="pipeline-label">{step.label}</span>
                      <span className="pipeline-desc">{step.desc}</span>
                    </div>
                    <div className="pipeline-status-dot" />
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {activeView === 'about' && (
            <motion.div
              key="about"
              className="about-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <motion.div className="about-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3>
                  <Sparkles className="about-icon" />
                  Why multi-agent?
                </h3>
                <p>
                  Each agent specializes: one reads files, one understands resumes, one decodes JDs, and one makes
                  the final call. This mirrors a real hiring pipeline and keeps each prompt laser-focused.
                </p>
              </motion.div>
              <motion.div className="about-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <h3>
                  <Brain className="about-icon" />
                  Built for robustness
                </h3>
                <p>
                  Gemini is the primary brain, with Groq and local parsing as fallbacks. If everything fails, the
                  system gracefully asks for manual review instead of crashing.
                </p>
              </motion.div>
              <motion.div className="about-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h3>
                  <TrendingUp className="about-icon" />
                  Designed for iteration
                </h3>
                <p>
                  The LangGraph pipeline can be extended with new agents: bias checks, salary alignment, or company
                  culture fit, without rewriting the whole app.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button (studio view) */}
        {activeView === 'studio' && (
          <motion.button
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.02, y: -2 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="spinner" />
                <span>Analyzing with AI...</span>
              </>
            ) : (
              <>
                <Zap className="btn-icon" />
                <span>Analyze Resume</span>
              </>
            )}
          </motion.button>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              className="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {/* Result Header */}
              <div className={`result-header ${getRecommendationStyle(result.recommendation).color}`}>
                <div className="recommendation">
                  {(() => {
                    const { icon: Icon, text } = getRecommendationStyle(result.recommendation)
                    return (
                      <>
                        <Icon className="rec-icon" />
                        <span>{text}</span>
                      </>
                    )
                  })()}
                </div>
                <div className="score-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="score-bg" />
                    <motion.circle 
                      cx="50" cy="50" r="45" 
                      className="score-fill"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * (result.match_score || 0)) }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className="score-text">{Math.round((result.match_score || 0) * 100)}%</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="metrics-grid">
                <motion.div 
                  className="metric"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Target className="metric-icon" />
                  <div className="metric-content">
                    <span className="metric-value">{Math.round((result.match_score || 0) * 100)}%</span>
                    <span className="metric-label">Match Score</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="metric"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <TrendingUp className="metric-icon" />
                  <div className="metric-content">
                    <span className="metric-value">{Math.round((result.confidence || 0) * 100)}%</span>
                    <span className="metric-label">Confidence</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="metric"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Brain className="metric-icon" />
                  <div className="metric-content">
                    <span className="metric-value">{result.requires_human ? 'Yes' : 'No'}</span>
                    <span className="metric-label">Human Review</span>
                  </div>
                </motion.div>
              </div>

              {/* Reasoning */}
              <motion.div 
                className="reasoning-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3>
                  <Sparkles className="reasoning-icon" />
                  AI Analysis
                </h3>
                <p>{result.reasoning_summary}</p>
              </motion.div>

              {/* JSON Toggle */}
              <button 
                className="json-toggle"
                onClick={() => setShowJson(!showJson)}
              >
                <Code2 />
                <span>{showJson ? 'Hide' : 'Show'} JSON Response</span>
                <ChevronDown className={`chevron ${showJson ? 'open' : ''}`} />
              </button>

              <AnimatePresence>
                {showJson && (
                  <motion.pre
                    className="json-output"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {JSON.stringify(result, null, 2)}
                  </motion.pre>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        </LayoutGroup>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Built with ❤️ using LangChain + LangGraph + Gemini</p>
      </footer>
    </div>
  )
}

export default App
