

import React, { useState } from 'react';
import { useLiveEQAnalysis } from './useLiveEQAnalysis';
import ParticleBackground from './ParticleBackground';
import AnimatedCircuitBackground from './AnimatedCircuitBackground';
import ArchetypeAlignment from './ArchetypeAlignment';


const ARCHETYPES = ["The Resonant Eye", "The Discordant", "Street Mage"];

const App: React.FC = () => {
  const [selectedArchetype, setSelectedArchetype] = useState<string>(ARCHETYPES[0]);
  const { eqScore, tonality, startAnalysis, stopAnalysis } = useLiveEQAnalysis();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Candidate scoring logic can be implemented as a function that takes EQ, tonality, and other metrics
  // For now, just display the live EQ score and tonality

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0a0a23', color: '#fff' }}>
      <AnimatedCircuitBackground />
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '2.5rem', color: '#00fff7', textShadow: '0 0 16px #00fff7' }}>
          AI Adaptive Interview<br />Western & Southern Financial Group
        </h1>
        <div style={{ margin: '1rem 0' }}>
          {ARCHETYPES.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedArchetype(name)}
              style={{
                marginRight: 12,
                padding: '0.5em 1em',
                borderRadius: 8,
                border: 'none',
                background: selectedArchetype === name ? '#00fff7' : '#222',
                color: selectedArchetype === name ? '#222' : '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: selectedArchetype === name ? '0 0 8px #00fff7' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div style={{ margin: '1rem 0' }}>
          <button
            onClick={() => {
              if (isAnalyzing) {
                stopAnalysis();
                setIsAnalyzing(false);
              } else {
                startAnalysis();
                setIsAnalyzing(true);
              }
            }}
            style={{
              padding: '0.5em 1em',
              borderRadius: 8,
              border: 'none',
              background: isAnalyzing ? '#ff5c5c' : '#00fff7',
              color: isAnalyzing ? '#fff' : '#222',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: 12,
              transition: 'all 0.2s',
            }}
          >
            {isAnalyzing ? 'Stop Voice Analysis' : 'Start Voice Analysis'}
          </button>
          {typeof eqScore === 'number' && (
            <span style={{ marginLeft: 16, color: '#00fff7' }}>Live EQ Score: <b>{eqScore}</b></span>
          )}
          {typeof tonality === 'number' && (
            <span style={{ marginLeft: 16, color: '#7f5cff' }}>Tonality: <b>{tonality}</b></span>
          )}
        </div>
        <ArchetypeAlignment archetype={selectedArchetype} eqScore={eqScore ?? undefined} />
        {/* Add more main UI or dashboard here */}
      </div>
    </div>
  );
};

export default App;
