import React, { createContext, useContext, useState } from 'react';

interface DragAndDropContextType {
  overComponents: Map<string, boolean>;
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
  const [overComponents, setOverComponents] = useState<Map<string, boolean>>(new Map());

  const setOverComponentId = (id: string | null) => {
    setOverComponents(prev => {
      const updated = new Map();
      if (id) {
        updated.set(id, true);
        prev.forEach((value, key) => {
          if (key !== id) updated.set(key, false);
        });
      } else {
        prev.forEach((value, key) => {
          updated.set(key, false);
        });
      }
      
      return updated;
    });
  };

  return (
    <DragAndDropContext.Provider value={{ overComponents, setOverComponentId }}>
      {children}
    </DragAndDropContext.Provider>
  );
};
