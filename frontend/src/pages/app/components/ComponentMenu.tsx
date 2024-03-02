import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Label } from "@/components/ui/label"; // Adjust the path as necessary
import { Button } from "@/components/ui/button"; // Adjust the path as necessary

const DraggableComponent = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const ComponentMenu = () => {
  return (
    <div className="h-full overflow-y-auto p-4 bg-gray-100">
      <DraggableComponent id="label">
        <Label>Label</Label>
      </DraggableComponent>
      <DraggableComponent id="button">
        <Button>Button</Button>
      </DraggableComponent>
    </div>
  );
};

export default ComponentMenu;
