import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const Canvas = () => {
  const { setNodeRef } = useDroppable({
    id: 'canvas',
  });

  return (
    <div ref={setNodeRef} className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-300">
      {/* Dropped components will be rendered here */}
    </div>
  );
};

export default Canvas;
