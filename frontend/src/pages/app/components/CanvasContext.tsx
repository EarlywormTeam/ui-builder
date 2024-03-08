// import React, { createContext, useContext, useState } from 'react';
// import { ComponentProps } from './ir/componentProps';

// const CanvasContext = createContext<{ components: ComponentProps[]; addComponent: (component: ComponentProps, parentId?: string) => void, updateComponent: (componentId: string, newProps: Partial<ComponentProps>) => void } | undefined>(undefined);

// export const useCanvas = () => {
//   const context = useContext(CanvasContext);
//   if (context === undefined) {
//     throw new Error('useCanvas must be used within a CanvasProvider');
//   }
//   return context;
// };

// export const CanvasProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
//   const [components, setComponents] = useState<ComponentProps[]>([]);

//   const updateComponent = (componentId: string, newProps: Partial<ComponentProps>) => {
//     setComponents((prevComponents) => {
//       const updateComponentInArray = (components: ComponentProps[]): ComponentProps[] => {
//         return components.map((comp) => {
//           if (comp.id === componentId) {
//             return { ...comp, ...newProps };
//           } else if (Array.isArray(comp.children) && comp.children.length > 0) {
//             return { ...comp, children: updateComponentInArray(comp.children) };
//           }
//           return comp;
//         });
//       };
//       return updateComponentInArray(prevComponents);
//     });
//   };

//   const addComponent = (component: ComponentProps, parentId?: string) => {
//     setComponents((prevComponents) => {
//       if (parentId) {
//         const addComponentToParent = (components: ComponentProps[], parentId: string, component: ComponentProps): ComponentProps[] => {
//           return components.map((comp) => {
//             if (comp.id === parentId) {
//               const updatedChildren = Array.isArray(comp.children) ? [...comp.children, component] : [component];
//               return { ...comp, children: updatedChildren };
//             } else if (Array.isArray(comp.children) && comp.children.length > 0) {
//               return { ...comp, children: addComponentToParent(comp.children, parentId, component) };
//             }
//             return comp;
//           });
//         };
//         return addComponentToParent(prevComponents, parentId, component);
//       }
//       return [...prevComponents, component];
//     });
//   };

//   return (
//     <CanvasContext.Provider value={{ components, addComponent, updateComponent }}>
//       {children}
//     </CanvasContext.Provider>
//   );
// };
export {}