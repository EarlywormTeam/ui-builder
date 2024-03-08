// import { createContext, useContext, useState } from 'react';
// import { ComponentProps } from './componentProps';

// const CanvasComponentContext = createContext<{ componentProps: ComponentProps } | undefined>(undefined);

// export const useCanvasComponent = () => {
//   const context = useContext(CanvasComponentContext);
//   if (!context) {
//     throw new Error('useCanvasComponent must be used within a CanvasComponentProvider');
//   }
//   return context;
// };

// export const CanvasComponentProvider = ({ inputComponentProps }: { inputComponentProps: ComponentProps }) => {
//   const [componentProps, setComponentProps] = useState<ComponentProps>(inputComponentProps);
  
//   return (
//     <CanvasComponentContext.Provider value={{ componentProps }}>
      
//     </CanvasComponentContext.Provider>
//   );
// };

export {}