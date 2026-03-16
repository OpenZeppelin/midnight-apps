'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

// Define the possible versions
export type AppVersion = 'V1' | 'V2' | 'V3';

// Define the shape of the context
interface VersionContextType {
  version: AppVersion;
  setVersion: (version: AppVersion) => void;
}

// Create the context with a default value
const VersionContext = createContext<VersionContextType | undefined>(undefined);

// Create the provider component
export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<AppVersion>('V1'); // Default to V1

  const value = useMemo(() => ({ version, setVersion }), [version]);

  return (
    <VersionContext.Provider value={value}>{children}</VersionContext.Provider>
  );
}

// Create a custom hook for easy access to the context
export function useVersion() {
  const context = useContext(VersionContext);
  if (context === undefined) {
    throw new Error('useVersion must be used within a VersionProvider');
  }
  return context;
}
