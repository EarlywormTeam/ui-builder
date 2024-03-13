import React, { createContext, useContext, useState } from 'react';

interface Collision {
  id: string;
  rect: DOMRect;
}

interface PointerLocation {
  x: number;
  y: number;
}

interface DragAndDropContextType {
  overComponentId: string | null;
  setOverComponentId: (id: string | null) => void;
  setCollisions: (collisions: Collision[], pointerLocation: PointerLocation) => void;
  getMarginAdjustmentForId: (id: string) => string;
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
  // const [overComponentId, setOverComponentId] = useState<string | null>(null);
  // const [pointerLocation, setPointerLocation] = useState<PointerLocation>({ x: 0, y: 0 });
  // const [collisions, setCollisionsState] = useState<Collision[]>([]);

  // const setCollisions = (newCollisions: Collision[], pointerLocation: PointerLocation) => {
  //   // Logic to adjust margins based on pointer location and collisions
  //   setCollisionsState(newCollisions);
  //   setPointerLocation(pointerLocation);
  // };

  // const getMarginAdjustmentForId = (id: string): string => {
  //   const collision = collisions.find(c => c.id === id);
  //   if (!collision) {
  //     return '';
  //   }

  //   const innerRectLeft = collision.rect.left + collision.rect.width * 0.35;
  //   const innerRectRight = collision.rect.right - collision.rect.width * 0.35;
  //   const innerRectTop = collision.rect.top + collision.rect.height * 0.35;
  //   const innerRectBottom = collision.rect.bottom - collision.rect.height * 0.35;

  //   const pointerInsideInnerRect = pointerLocation.x > innerRectLeft && pointerLocation.x < innerRectRight && pointerLocation.y > innerRectTop && pointerLocation.y < innerRectBottom;

  //   let adj: string = '';
  //   if (pointerInsideInnerRect) {
  //     adj = 'p-4';
  //   } else {
  //     if (pointerLocation.x <= collision.rect.left) {
  //       adj = 'mr-4';
  //     } else if (pointerLocation.x >= collision.rect.right) {
  //       adj = 'ml-4';
  //     }

  //     if (pointerLocation.y <= collision.rect.top) {
  //       adj = 'mb-4';
  //     } else if (pointerLocation.y >= collision.rect.bottom) {
  //       adj = 'mt-4';
  //     }
  //   }

  //   return adj;
  // };

  return (
    <></>
    // <DragAndDropContext.Provider value={{ overComponentId, setOverComponentId, setCollisions, getMarginAdjustmentForId }}>
    //   {children}
    // </DragAndDropContext.Provider>
  );
};
