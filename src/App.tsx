import React from 'react';
import { AdaptiveQuestion } from './AdaptiveQuestion';
import ProgressBar from './ProgressBar';
import TronStartScreen from './TronStartScreen';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import SummaryScreen from './SummaryScreen';
import { useVoiceControl } from './useVoiceControl';
import ParticleBackground from './ParticleBackground';
import AnimatedCircuitBackground from './AnimatedCircuitBackground';
import AdaptiveFeedback from './AdaptiveFeedback';
import AICoachPanel from './AICoachPanel';
import ArchetypeAlignment from './ArchetypeAlignment';
import VoiceAnalysisDemo from './VoiceAnalysisDemo';
import { OnboardingModal } from './OnboardingModal';

const QUESTIONS = [
  'Describe a time you demonstrated leadership in a financial context.',
  'How do you approach ethical dilemmas in client relationships?',
  'Share an example of adapting to regulatory changes.',
  'How do you communicate complex financial concepts to non-experts?',
  'Tell us about a time you resolved a conflict within a team.',
  'How do you ensure data privacy and compliance in your work?',
  'Describe your approach to continuous learning in finance.',
  'How do you balance risk and innovation in financial decision-making?'
];
const ARCHETYPES = [
  'Innovator', 'Guardian', 'Connector', 'Analyst', 'Achiever', 'Strategist', 'Empath', 'Visionary'
];

function App() {
  const { state, dispatch } = useAppState();
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [onboardingStep, setOnboardingStep] = React.useState(0);
  const [showPreamble, setShowPreamble] = React.useState(false);
  // Allow skipping onboarding/preamble via URL (e.g., ?start=1)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('start') || params.has('skip') || params.get('mode') === 'demo') {
        setShowOnboarding(false);
        setShowPreamble(false);
        dispatch({ type: 'SET_STARTED', value: true });
      }
    } catch {}
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Onboarding steps with clear instructions
  const onboardingStepsData = [
    {
      title: 'Welcome',
      description: 'Welcome to the AI Adaptive Interview. This process will guide you through a series of questions to assess your emotional intelligence and role fit.'
    },
    {
      title: 'Instructions',
      description: 'You will answer several questions. Speak clearly and honestly. Your responses will be analyzed for feedback and insights.'
    },
    {
      title: 'Privacy',
      description: 'Your responses are confidential and used only for assessment purposes. No data will be shared outside this process.'
    },
    {
      title: 'Begin Interview',
      description: 'Click finish to begin the interview.'
    }
  ];
  const totalQuestions = QUESTIONS.length;
  const { listening, start, stop, error } = useVoiceControl({});

  React.useEffect(() => {
    if (state.currentQuestion >= totalQuestions && !state.showSummary) {
      dispatch({ type: 'SET_SHOW_SUMMARY', value: true });
    }
  }, [state.currentQuestion, totalQuestions, state.showSummary, dispatch]);

  function handleBackendError(msg: string) {
    dispatch({ type: 'SET_GLOBAL_ERROR', value: msg });
  }

  return (
    <>
      {state.globalError ? (
        <div data-testid="global-error-banner" style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: '#ff4d4f', color: '#fff', fontWeight: 'bold', padding: '1em', zIndex: 9999, textAlign: 'center' }}>
          {state.globalError} <button role="button" aria-label="Dismiss" name="dismiss" data-testid="global-error-dismiss" style={{ marginLeft: 16, background: '#fff', color: '#ff4d4f', border: 'none', borderRadius: 6, padding: '0.3em 1em', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => dispatch({ type: 'SET_GLOBAL_ERROR', value: '' })}>Dismiss</button>
        </div>
      ) : null}
      {showOnboarding ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <AnimatedCircuitBackground />
          <ParticleBackground />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <OnboardingModal
              steps={onboardingStepsData}
              currentStep={onboardingStep}
              onNext={() => setOnboardingStep((s) => Math.min(s + 1, onboardingStepsData.length - 1))}
              onBack={() => setOnboardingStep((s) => Math.max(s - 1, 0))}
              onFinish={() => { setShowOnboarding(false); setShowPreamble(true); }}
            />
          </div>
        </div>
      ) : showPreamble ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <TronStartScreen onStart={() => { setShowPreamble(false); dispatch({ type: 'SET_STARTED', value: true }); }} />
        </div>
      ) : state.showSummary ? (
        <SummaryScreen
          responses={state.responses?.map((r, i) => ({
            analysis: r || {},
            prompt: QUESTIONS[i] || ''
          })) || []}
          candidateName={state.candidateName || ''}
        />
      ) : (
        <div style={{ position: 'relative' }} key={state.globalError}>
          {/* Preamble now handled above with showPreamble */}
          <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: '#0a0a23',
            color: '#fff',
            opacity: state.started ? 1 : 0,
            transform: state.started ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.98)',
            transition: 'opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1)',
            willChange: 'opacity, transform',
          }}>
            <AnimatedCircuitBackground />
            <ParticleBackground />
            <div style={{ position: 'relative', zIndex: 1, padding: '2rem', maxWidth: 700, margin: '0 auto' }}>
              <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '2.5rem', color: '#00fff7', textShadow: '0 0 16px #00fff7', marginBottom: 24, textAlign: 'center' }}>
                AI Adaptive Interview<br />Western & Southern Financial Group
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #181f2b 60%, #232a3d 100%)',
                  borderRadius: 22,
                  boxShadow: '0 4px 32px #00fff799',
                  padding: '2.5rem 2rem 2rem 2rem',
                  maxWidth: 600,
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 24,
                  border: '1.5px solid #00fff7',
                  position: 'relative',
                }}>
                  <ProgressBar current={state.currentQuestion} total={totalQuestions} />
                  <div style={{
                    margin: '2rem 0 1rem 0',
                    fontSize: 26,
                    color: '#00fff7',
                    fontWeight: 800,
                    textAlign: 'center',
                    textShadow: '0 0 18px #00fff7',
                    letterSpacing: 0.5,
                    lineHeight: 1.3,
                    borderBottom: '1px solid #222',
                    paddingBottom: 12,
                    width: '100%',
                  }}>
                    {QUESTIONS[state.currentQuestion]}
                  </div>
                  <div style={{ display: 'flex', gap: 16, margin: '1.2rem 0 0.5rem 0', width: '100%', justifyContent: 'center' }}>
                    <button
                      onClick={() => dispatch({ type: 'SET_CURRENT_QUESTION', value: Math.max(state.currentQuestion - 1, 0) })}
                      disabled={state.currentQuestion === 0}
                      className="animated-btn"
                      style={{
                        background: state.currentQuestion === 0 ? '#444' : '#00fff7',
                        color: state.currentQuestion === 0 ? '#aaa' : '#222',
                        fontWeight: 'bold',
                        fontSize: 18,
                        borderRadius: 14,
                        padding: '0.7em 2.2em',
                        boxShadow: state.currentQuestion === 0 ? 'none' : '0 0 16px #00fff7',
                        letterSpacing: 1,
                        transition: 'background 0.2s, color 0.2s',
                        border: 'none',
                      }}
                    >Previous</button>
                  </div>
                  <div style={{ width: '100%', marginTop: 12 }}>
                    <VoiceAnalysisDemo />
                  </div>
                </div>
                <div style={{ background: 'rgba(20,40,30,0.92)', borderRadius: 18, boxShadow: '0 0 12px #00ff9977', padding: '2rem', maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <AdaptiveFeedback
                    text={state.voiceTranscript || state.responses[state.currentQuestion]?.text || ''}
                    sentiment={state.responses[state.currentQuestion]?.sentiment || ''}
                    eqScore={state.responses[state.currentQuestion]?.eqScore}
                    onError={handleBackendError}
                  />
                  <AdaptiveQuestion
                    text={state.voiceTranscript || state.responses[state.currentQuestion]?.text || ''}
                    sentiment={state.responses[state.currentQuestion]?.sentiment || ''}
                    eqScore={state.responses[state.currentQuestion]?.eqScore}
                    totalQuestions={totalQuestions}
                    onError={handleBackendError}
                    onRespond={(text, sentiment, eqScore) => {
                      const updated = [...state.responses];
                      updated[state.currentQuestion] = { text, sentiment, eqScore };
                      dispatch({ type: 'SET_RESPONSES', value: updated });
                      dispatch({ type: 'SET_VOICE_TRANSCRIPT', value: '' });
                    }}
                  />
                  <AICoachPanel eqScore={state.responses[state.currentQuestion]?.eqScore} sentiment={state.responses[state.currentQuestion]?.sentiment} archetype={state.selectedArchetype} />
                </div>
                <div style={{ background: 'rgba(20,30,50,0.85)', borderRadius: 18, boxShadow: '0 0 8px #00fff799', padding: '2rem', maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                  <ArchetypeAlignment archetype={state.selectedArchetype} eqScore={state.responses[state.currentQuestion]?.eqScore} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0 0 0' }}>
                  <button
                    onClick={() => dispatch({ type: 'SET_SHOW_SUMMARY', value: true })}
                    className="animated-btn"
                    style={{ background: '#00fff7', color: '#222', fontWeight: 'bold', fontSize: 18, borderRadius: 12, padding: '0.7em 2em', boxShadow: '0 0 12px #00fff7', letterSpacing: 1, transition: 'background 0.2s, color 0.2s' }}
                  >
                    Show Analytics & Review
                  </button>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', top: 24, right: 32, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <button
                onClick={listening ? stop : start}
                style={{
                  background: listening ? '#7f5cff' : '#181f2b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 56,
                  height: 56,
                  boxShadow: listening ? '0 0 16px #7f5cff88' : '0 0 8px #222',
                  fontSize: 28,
                  cursor: 'pointer',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
                aria-label={listening ? 'Stop voice control' : 'Start voice control'}
              >
                {listening ? '🎤' : '🛑'}
              </button>
              <div style={{ marginTop: 8, color: '#fff', fontSize: 14, minHeight: 20, maxWidth: 220, textAlign: 'right', wordBreak: 'break-word' }}>
                {error ? <span style={{ color: '#ff4d4f' }}>{error}</span> : state.voiceTranscript}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { ErrorBoundary } from './ErrorBoundary';

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </ErrorBoundary>
  );
}
