import React from 'react';

const SovereignDataBadge: React.FC = () => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    background: 'linear-gradient(90deg, #00fff7 0%, #7f5cff 100%)',
    color: '#222',
    borderRadius: 20,
    padding: '0.4em 1.2em',
    fontWeight: 700,
    fontSize: 15,
    boxShadow: '0 0 8px #00fff799',
    letterSpacing: 1,
    margin: '8px 0',
    border: '2px solid #ffd700',
  }}
    title="All analytics and data are processed and stored locally. No third-party or cloud vendors."
  >
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ marginRight: 8 }}>
      <circle cx="11" cy="11" r="10" stroke="#ffd700" strokeWidth="2" fill="#e6f7ff" />
      <path d="M7 11.5L10 14.5L15 8.5" stroke="#00fff7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    Sovereign Data
  </div>
);

export default SovereignDataBadge;
