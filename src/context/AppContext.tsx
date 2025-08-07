import React, { createContext, useContext, type ReactNode } from 'react';

interface AppContextType {
  openTextEditor: (fileName: string, filePath: string, content: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
  openTextEditor: (fileName: string, filePath: string, content: string) => void;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, openTextEditor }) => {
  return (
    <AppContext.Provider value={{ openTextEditor }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
