import { useState, useEffect } from 'react';
import { DndContext, useSensors, useSensor, PointerSensor, DragOverlay, DragEndEvent } from '@dnd-kit/core';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/redux/store';
import ComponentMenu from './components/ComponentMenu'; // Your component menu component
import Canvas from './components/Canvas'; // Your canvas component
import { Button } from 'src/components/ui/button';
import { add, deleteSelected, doMagicWiring, doMagicPaint, insertChild, removeId } from 'src/redux/slice/canvasSlice';
import ProjectStartModal from './components/ProjectStartModal';
import ComponentMap from './components/ComponentMap';
import { DynamicElement } from './components/ir/good/DynamicElement';

const DragAndDrop = () => {
  const dispatch = useDispatch();
  const [isPreview, setIsPreview] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const configMap = useSelector((state: RootState) => state.canvas.configMap);
  const childrenMap = useSelector((state: RootState) => state.canvas.childrenMap);
  const magicWiringLoading = useSelector((state: RootState) => state.canvas.magicWiringLoading);
  const magicPaintingLoading = useSelector((state: RootState) => state.canvas.magicPaintingLoading);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        dispatch(deleteSelected());
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch]);

  const onDragStart = (event: { active: { id: string; children?: React.ReactNode[] } }) => {
    setActiveId(event.active.id);
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over, collisions } = event;
    
    if (over && active.id !== over.id) {

      const activeIdString = active.id.toString();
      let newId = activeIdString;
      if (activeIdString.includes('__demo')) {
        const adjustedId = activeIdString.replace('__demo', '');
        const newConfig = configMap[adjustedId];
        newId = `comp-${Math.random().toString(36).substr(2, 9)}`;
        dispatch(add({id: newId, config: newConfig}));
      } else {
        dispatch(removeId({id: newId}));
      }

      // const filteredCollisions = collisions?.filter((collision) => collision.id.toString() !== over?.id.toString());
      // if (filteredCollisions && filteredCollisions.length === 2) {
      //   const parentChildren = childrenMap[over.id.toString()];
      //   const collisionIndexes = filteredCollisions.map((collision) => parentChildren.indexOf(collision.id.toString())).sort((a, b) => a - b);
      //   const middleIndex = collisionIndexes[0] + 1;
      //   dispatch(insertChild({id: newId, parentId: over.id.toString(), index: middleIndex}));
      // } else {
        dispatch(insertChild({id: newId, parentId: over.id.toString(), index: null}));
      // }
    }
    setActiveId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 25
      },
    }),
  );

  return (
    <DndContext onDragStart={(event) => onDragStart(event as any)} onDragEnd={(event) => onDragEnd(event as any)} sensors={sensors}>
      <div className="flex h-full w-full overflow-hidden">
        <ProjectStartModal/>
        <div className="flex h-full w-1/4">
          <ComponentMap />
        </div>
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
              onClick={() => dispatch(doMagicPaint())}
              disabled={magicWiringLoading || magicPaintingLoading} // Disable button when loading
            >
              {magicPaintingLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <img src={process.env.PUBLIC_URL + "/paintbrush.svg"} alt="AI Magic Painting" style={{width: '100%', height: '100%', objectFit: 'contain'}} /> 
              )}
            </Button>
            <Button 
              variant={'default'} 
              onClick={() => dispatch(doMagicWiring())}
              disabled={magicWiringLoading || magicPaintingLoading} // Disable button when loading
            >
              {magicWiringLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <img src={process.env.PUBLIC_URL + "/magic.svg"} alt="AI Magic Coding" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
              )}
            </Button>
          </div>
          <ComponentMenu />
        </div>
        <DragOverlay dropAnimation={ {
          duration: 400,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
          {activeId ? (
            <DynamicElement id={activeId} draggable={false} droppable={false} mode="preview" />
          ): null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default DragAndDrop;
