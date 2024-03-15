import React, { createContext, useContext, useState } from 'react';

interface DragAndDropContextType {
  overComponentId: string | null;
  setOverComponentId: (id: string | null) => void;
}

const DragAndDropContext = createContext<DragAndDropContextType | undefined>(undefined);

export const useDragAndDropContext = () => {
  const context = useContext(DragAndDropContext);
  if (!context) {
    throw new Error('useDragAndDropContext must be used within a DragAndDropProvider');
  }
  return context;
};

export const DragAndDropProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [overComponentId, setOverComponentId] = useState<string | null>(null);

  return (
    <DragAndDropContext.Provider value={{ overComponentId, setOverComponentId }}>
      {children}
    </DragAndDropContext.Provider>
  );
};
