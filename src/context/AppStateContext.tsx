import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// --- State Shape ---
export interface AppState {
  started: boolean;
  currentQuestion: number;
  responses: Array<{ text: string; sentiment: string; eqScore?: number; emotion_scores?: any; voice_features?: any; archetype?: string }>;
  candidateName: string;
  globalError: string;
  showSummary: boolean;
  selectedArchetype: string;
  voiceTranscript: string;
  isAnalyzing: boolean;
  // Adaptive prompt overrides per question index
  promptOverrides: Record<number, string>;
  // Optimistic paging: indicates background fetch for next prompt is in-flight
  pendingNext: boolean;
  pendingNextIndex?: number | null;
}

export const initialState: AppState = {
  started: false,
  currentQuestion: 0,
  responses: [
    { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' },
    { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' },
    { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' },
    { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' },
    { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' }
  ],
  candidateName: '',
  globalError: '',
  showSummary: false,
  selectedArchetype: '',
  voiceTranscript: '',
  isAnalyzing: false,
  promptOverrides: {},
  pendingNext: false,
  pendingNextIndex: null,
}

// --- Actions ---
type Action =
  | { type: 'SET_STARTED'; value: boolean }
  | { type: 'SET_CURRENT_QUESTION'; value: number }
  | { type: 'SET_RESPONSES'; value: AppState['responses'] }
  | { type: 'SET_CANDIDATE_NAME'; value: string }
  | { type: 'SET_GLOBAL_ERROR'; value: string }
  | { type: 'SET_SHOW_SUMMARY'; value: boolean }
  | { type: 'SET_SELECTED_ARCHETYPE'; value: string }
  | { type: 'SET_VOICE_TRANSCRIPT'; value: string }
  | { type: 'SET_IS_ANALYZING'; value: boolean }
  | { type: 'SET_PROMPT_OVERRIDE'; index: number; value: string }
  | { type: 'SET_PENDING_NEXT'; value: boolean; index?: number | null };

function appStateReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STARTED':
      return { ...state, started: action.value };
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestion: action.value };
    case 'SET_RESPONSES':
      return { ...state, responses: action.value };
    case 'SET_CANDIDATE_NAME':
      return { ...state, candidateName: action.value };
    case 'SET_GLOBAL_ERROR':
      return { ...state, globalError: action.value };
    case 'SET_SHOW_SUMMARY':
      return { ...state, showSummary: action.value };
    case 'SET_SELECTED_ARCHETYPE':
      return { ...state, selectedArchetype: action.value };
    case 'SET_VOICE_TRANSCRIPT':
      return { ...state, voiceTranscript: action.value };
    case 'SET_IS_ANALYZING':
      return { ...state, isAnalyzing: action.value };
    case 'SET_PROMPT_OVERRIDE':
      return { ...state, promptOverrides: { ...state.promptOverrides, [action.index]: action.value } };
    case 'SET_PENDING_NEXT':
      return { ...state, pendingNext: action.value, pendingNextIndex: action.index ?? state.pendingNextIndex };
    default:
      return state;
  }
}

export const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export const useAppState = () => useContext(AppStateContext);

interface AppStateProviderProps {
  children: ReactNode;
  initialStateOverride?: Partial<AppState>;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children, initialStateOverride }) => {
  const mergedInitial = { ...initialState, ...(initialStateOverride || {}) } as AppState;
  const [state, dispatch] = useReducer(appStateReducer, mergedInitial);
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};
