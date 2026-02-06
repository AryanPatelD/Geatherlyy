'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface QuizContextType {
  isQuizInProgress: boolean;
  setQuizInProgress: (inProgress: boolean) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [isQuizInProgress, setQuizInProgress] = useState(false);

  return (
    <QuizContext.Provider value={{ isQuizInProgress, setQuizInProgress }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuizContext() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuizContext must be used within a QuizProvider');
  }
  return context;
}
