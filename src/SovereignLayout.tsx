// Sovereign layout abstraction for rapid UI/UX adaptation
// Use this component to wrap pages and apply theme/layout logic

import React from 'react';
import { theme } from './theme';

interface SovereignLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function SovereignLayout({ children, header, footer }: SovereignLayoutProps) {
  return (
    <div style={{
      background: theme.colors.background,
      color: theme.colors.text,
      minHeight: '100vh',
      fontFamily: theme.fonts.body,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      {header && <header style={{ width: '100%', padding: theme.spacing.md }}>{header}</header>}
      <main style={{ width: '100%', maxWidth: 900, padding: theme.spacing.lg }}>{children}</main>
      {footer && <footer style={{ width: '100%', padding: theme.spacing.md }}>{footer}</footer>}
    </div>
  );
}
