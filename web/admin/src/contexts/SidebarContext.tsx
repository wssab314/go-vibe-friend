import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // Check sidebar collapsed preference from localStorage
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true');
    }
  }, []);

  const handleSetIsCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
  };

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      setIsCollapsed: handleSetIsCollapsed,
      isMobileOpen,
      setIsMobileOpen
    }}>
      {children}
    </SidebarContext.Provider>
  );
};