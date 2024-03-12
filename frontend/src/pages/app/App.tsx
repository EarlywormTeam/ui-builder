import { useState, useEffect } from 'react';
import { DndContext, useSensors, useSensor, PointerSensor, DragOverlay, DragEndEvent } from '@dnd-kit/core';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/redux/store';
import ComponentMenu from './components/ComponentMenu'; // Your component menu component
import Canvas from './components/Canvas'; // Your canvas component
import { add, deleteSelected, insertChild, removeId, setSelectedIds } from 'src/redux/slice/canvasSlice';
import ProjectStartModal from './components/ProjectStartModal';
import ComponentMap from './components/ComponentMap';
import { DynamicElement } from './components/ir/good/DynamicElement';
import Toolbar from './components/Toolbar';

const DragAndDrop = () => {
  const dispatch = useDispatch();
  const [isPreview, setIsPreview] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const demoConfigMap = useSelector((state: RootState) => state.canvas.demoConfigMap);
  // Be careful with this - since list updates the childrenMap in real time in preview mode, this has a conflict and causes bad re-renders.
  // const childrenMap = useSelector((state: RootState) => state.canvas.componentState.present.childrenMap);
  const projectTemplateLoading = useSelector((state: RootState) => state.loading.projectTemplateLoading);
  

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

  useEffect(() => {
    if (isPreview) {
      dispatch(setSelectedIds([]));
    }
  }, [dispatch, isPreview]);

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
        const newConfig = demoConfigMap[adjustedId];
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
    <div className={`h-full w-full relative ${projectTemplateLoading ? 'pointer-events-none' : ''}`}>
      {projectTemplateLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-white"></div>
        </div>
      )}
      <DndContext onDragStart={(event) => onDragStart(event as any)} onDragEnd={(event) => onDragEnd(event as any)} sensors={sensors}>
        <div className="flex flex-col h-full w-full overflow-hidden">
          <ProjectStartModal/>
          <Toolbar isPreview={isPreview} setIsPreview={setIsPreview} />
          <div className="flex h-full w-full overflow-hidden">
            <div className="flex h-full w-1/4">
              <ComponentMap />
            </div>
            <div className="flex h-full w-full">
              <Canvas isPreview={isPreview} />
            </div>
            <div className="flex h-full w-1/4 gap-4">
              <ComponentMenu />
            </div>
            <DragOverlay dropAnimation={{
              duration: 400,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeId ? (
                <DynamicElement id={activeId} listIndex={undefined} key={undefined} draggable={false} droppable={false} mode="preview" />
              ) : null}
            </DragOverlay>
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default DragAndDrop;
