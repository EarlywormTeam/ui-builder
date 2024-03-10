import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const withDroppable = (Component: React.ElementType) => {
  return React.forwardRef(({ id, ...props }: { id: string } & any, ref) => {
    const { setNodeRef } = useDroppable({ id });

    // Combine forwarded ref with droppable ref
    const combinedRef = (node: HTMLElement | null) => {
      setNodeRef(node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Pass the combinedRef as a ref prop to the Component
    return <Component id={id} ref={combinedRef} {...props} />;
  });
};

export default withDroppable;