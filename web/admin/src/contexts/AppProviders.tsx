import React, { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext';
import { SidebarProvider } from './SidebarContext';
import { AuthProvider } from './AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default AppProviders;