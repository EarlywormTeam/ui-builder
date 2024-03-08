import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const withDraggable = (Component: React.ElementType) => {
  return ({ id, ...props }: any) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const adjTransform = transform ? { ...transform, scaleX: 1, scaleY: 1} : transform;
    const mergedStyle = {
      ...props.style,
      transform: CSS.Transform.toString(adjTransform),
      zIndex: 1000, // Ensure the draggable component appears above other content
    };
    console.log(adjTransform);

    // Pass the setNodeRef, attributes, and listeners through props to the Component
    return (
      <Component ref={setNodeRef} style={mergedStyle} {...attributes} {...listeners} {...props} />
    );
  };
};
export default withDraggable;

