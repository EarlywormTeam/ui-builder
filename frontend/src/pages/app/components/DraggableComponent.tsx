import React from 'react';
import { useDraggable } from '@dnd-kit/core';

const withDraggable = (Component: React.ElementType) => {
  return ({ id, ...props }: any) => {
    const { isDragging, attributes, listeners, setNodeRef } = useDraggable({ id });
    const mergedStyle = {
      ...props.style,
      opacity: isDragging ? 0.5 : 1, // Make the component 50% opaque
    };

    // Pass the setNodeRef, attributes, and listeners through props to the Component
    return (
      <Component id={id} ref={setNodeRef} style={mergedStyle} {...attributes} {...listeners} {...props} />
    );
  };
};
export default withDraggable;

