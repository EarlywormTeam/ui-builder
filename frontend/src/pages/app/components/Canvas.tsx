// import React, { useState, useEffect, useRef } from 'react';
// import DraggableComponent from './DraggableComponent';
// import { ComponentProps } from './ir/componentProps';
// import { useCanvas } from './CanvasContext'; // Adjust the path as necessary
// import { ColLayout, RowLayout } from 'src/components'; // Adjust the path as necessary
// import { Label, Button } from "src/components/ui"; // Adjust imports as necessary
import React from 'react';
import withDroppable from './DroppableComponent';
// import { useChildrenIds } from './ir/good/BuilderContext';
import { DynamicElement } from './ir/good/DynamicElement';
import { useChildrenIds } from 'src/redux/selector';


// const RenderComponent = ({ component, isPreview, updateComponent }: { component: ComponentProps, isPreview: boolean, updateComponent: (componentId: string, newProps: Partial<ComponentProps>) => void }) => {
//   const { type, children, id } = component;
//   const Component = componentMap[type];
//   const [isEditing, setIsEditing] = useState(false);
//   const editRef = useRef<null | HTMLDivElement>(null); // Ref to track the editing component

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       // Assuming the text input has a class name "editable-text-input"
//       const isClickInsideTextInput = event.target instanceof HTMLElement && event.target.classList.contains("editable-text-input");
    
//       if (!isClickInsideTextInput) {
//         setIsEditing(false);
//       }
//     };

//     // Add when editing is true and remove when it's false
//     if (isEditing) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isEditing]); // Only re-run if isEditing changes

//   if (!Component) return null;

//   const toggleEdit = () => {
//     if (type === 'label' || type === 'button') {
//       setIsEditing(true);
//     }
//   };
//   const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     updateComponent(component.id, { children: e.target.value });
//   };

//   if (isPreview) {
//     return (
//       <Component id={id}>
//         {Array.isArray(children) && children.length > 0 ? children.map((child: ComponentProps, index: number) => (
//           <RenderComponent key={index} component={child} isPreview={isPreview} updateComponent={updateComponent} />
//         )) : children}
//       </Component>
//     );
//   }

//   return isEditing ? (
//     <Component id={id} ref={editRef} onClick={toggleEdit}>
//       <input type="text" className="bg-white text-black border-1 border-gray-300 editable-text-input" value={typeof children === 'string' ? children : ''} onChange={handleTextChange} onBlur={() => setIsEditing(false)} autoFocus />
//     </Component>
//   ) : (
//     <DraggableComponent id={id}>
//       <DroppableComponent id={id}>
//         <Component id={id} ref={editRef}>
//           {Array.isArray(children) && children.length > 0 ? children.map((child: ComponentProps, index: number) => (
//             <RenderComponent key={index} component={child} isPreview={isPreview} updateComponent={updateComponent} />
//           )) : children}
//         </Component>
//       </DroppableComponent>
//     </DraggableComponent>
//   );
// };

const Canvas = ({ isPreview }: { isPreview: boolean }) => {
  // const { components, updateComponent } = useCanvas(); // Assume this is an array of component objects with a similar structure to ComponentProps
  const childrenIds = useChildrenIds('canvas');

  const CanvasContent = React.forwardRef<HTMLDivElement, React.PropsWithChildren<{}>>(({ children, ...props }, ref) => (
    <div ref={ref} className="flex w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 p-2" {...props}>
      {children}
    </div>
  ));

  const DroppableCanvasContent = withDroppable(CanvasContent);

  return (
    <DroppableCanvasContent id='canvas'>
      {childrenIds.length > 0 ? childrenIds.map((id: string) => 
      <DynamicElement id={id} draggable={false} droppable={true} mode={isPreview ? 'preview' : 'editing'} />
    ) : <p>No components to display</p>}
    </DroppableCanvasContent>
  );
};

export default Canvas;
