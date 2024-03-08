import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/redux/store';
// import { ComponentProps } from './components/ir/componentProps'; 
// import { CanvasProvider, useCanvas } from './components/CanvasContext';
import ComponentMenu from './components/ComponentMenu'; // Your component menu component
import Canvas from './components/Canvas'; // Your canvas component
import { Button } from 'src/components/ui/button';
// import { BuilderProvider, useBuilderContext } from './components/ir/good/BuilderContext';
import { add, doMagicWiring, insertChild } from 'src/redux/slice/canvasSlice';

const DragAndDrop = () => {
  // const { addComponent } = useCanvas();
  const dispatch = useDispatch();
  const [isPreview, setIsPreview] = useState(false);
  const configMap = useSelector((state: RootState) => state.canvas.configMap);
  const magicWiringLoading = useSelector((state: RootState) => state.canvas.magicWiringLoading);

  const onDragEnd = (event: { active: { id: string; children?: React.ReactNode[] }; over: { id: string } | null }) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const adjustedId = active.id.replace('__demo', '');
      const newConfig = configMap[adjustedId];
      const newId = `comp-${Math.random().toString(36).substr(2, 9)}`;
      dispatch(add({id: newId, config: newConfig}));
      dispatch(insertChild({id: newId, parentId: over.id, index: null}));
      // dispatch({ type: 'ADD', payload: { id: newId, config: newConfig } });
      // dispatch({ type: 'INSERT_CHILD', payload: { id: newId, parentId: over.id, index: null}});
    }
  };

  return (
    <DndContext onDragEnd={(event) => onDragEnd(event as any)}>
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full w-full">
          <Canvas isPreview={isPreview} />
        </div>
        <div className="flex flex-col h-full w-1/4 gap-4">
          <div className="flex w-full p-2 gap-2">
            <Button variant={'outline'} className='flex-grow' onClick={() => setIsPreview(!isPreview)}>
              {isPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button 
              variant={'default'} 
              onClick={() => dispatch(doMagicWiring())}
              disabled={magicWiringLoading} // Disable button when loading
            >
              {magicWiringLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <img src={process.env.PUBLIC_URL + "/magic.svg"} alt="AI Magic" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
              )}
            </Button>
          </div>
          <ComponentMenu />
        </div>
      </div>
    </DndContext>
  );
};

const App = () => {
  return (
    // <BuilderProvider>
      <DragAndDrop />
    // </BuilderProvider>
    // <CanvasProvider>
      // <DragAndDrop />
    // </CanvasProvider>
  )
}

export default App;
