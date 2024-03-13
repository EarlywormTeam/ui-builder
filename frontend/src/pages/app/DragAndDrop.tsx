import { useState } from 'react';
import { DndContext, useSensors, useSensor, PointerSensor, DragOverlay, DragEndEvent, DragMoveEvent, pointerWithin } from '@dnd-kit/core';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/redux/store';
import { add, deleteSelected, insertChild, removeId } from 'src/redux/slice/canvasSlice';
import { DynamicElement  } from './components/ir/good/DynamicElement';
import { ComponentConfig } from './components/ir/good/config';
import App from './AppInternal';
import { DragAndDropProvider, useDragAndDropContext } from './components/DragAndDropContext';

const DragAndDrop = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const demoConfigMap = useSelector((state: RootState) => state.canvas.demoConfigMap);
  // Be careful with this - since list updates the childrenMap in real time in preview mode, this has a conflict and causes bad re-renders.
  const childrenMap = useSelector((state: RootState) => state.canvas.componentState.present.childrenMap)
  const configMap = useSelector((state: RootState) => state.canvas.componentState.present.configMap);
  
  // const dndContext = useDragAndDropContext();

  const onDragStart = (event: { active: { id: string; children?: React.ReactNode[] } }) => {
    setActiveId(event.active.id);
  }

  const onDragMove = (event: DragMoveEvent) => {
   
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over, collisions } = event;

    let overId = over?.id;
    if (over && active.id !== over.id) {
      let pointerLocation = {x: 0, y: 0};
      if (event.activatorEvent instanceof MouseEvent) {
        pointerLocation = {x: event.activatorEvent.x + event.delta.x, y: event.activatorEvent.y + event.delta.y}
        console.log('pointer location', pointerLocation);
      }
      console.log('collisions', event.collisions);
      if (!event.collisions) { return; }
      // calculate inner drop area of top collision as maximum of 65% width and height, centered and 45.
      const dropRect = event.collisions[0].data?.droppableContainer.rect.current;
      if (!dropRect) { return; }

      // figure out the type of container
      let containerType = '';
      if (event.collisions.length > 1) {
        const containerId = event.collisions[1].id;
        if (containerId === 'canvas') {
          containerType = 'flex-row';
        } else {
          const containerConfig = configMap[containerId] as ComponentConfig;
          const classnames = containerConfig.attributes['className'];
          if (typeof classnames === 'string') {
            if (classnames.includes('flex-col')) {
              containerType = 'flex-col';
            } else if (classnames.includes('flex')) {
              containerType = 'flex-row';
            }
          }
        }
      }

      const innerDropWidth = containerType === 'flex-row' ? Math.max(dropRect.width * .65, 20) : dropRect.width;
      const innerDropHeight = containerType === 'flex-col' ? Math.max(dropRect.height * .65, 20) : dropRect.height;
      const innerDropRect = {
        x: dropRect.left + ((dropRect.width - innerDropWidth) / 2),
        y: dropRect.top + ((dropRect.height - innerDropHeight) / 2),
        width: innerDropWidth,
        height: innerDropHeight,
      };

      let index = null;
      if (pointerLocation.x > innerDropRect.x && pointerLocation.x < innerDropRect.x + innerDropRect.width && pointerLocation.y > innerDropRect.y && pointerLocation.y < innerDropRect.y + innerDropRect.height) {
        overId = event.collisions[0].id;
      } else if (event.collisions.length > 1) {
        overId = event.collisions[1].id;

        const parentChildren = childrenMap[overId.toString()];
        const collisionIndex = parentChildren.indexOf(event.collisions[0].id.toString());

        switch (containerType) {
          case 'flex-row':
            if (pointerLocation.x < innerDropRect.x + innerDropRect.width / 2) {
              index = collisionIndex;
            } else {
              index = collisionIndex + 1;
            }
            break;
          case 'flex-col':
            if (pointerLocation.y < innerDropRect.y + innerDropRect.height / 2) {
              index = collisionIndex;
            } else {
              index = collisionIndex + 1;
            }
            break;
        }
      }

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
          if (overId) {
            dispatch(insertChild({id: newId, parentId: overId.toString(), index: index}));
          }
          
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
      <DndContext collisionDetection={pointerWithin} onDragMove={(event) => onDragMove(event as any)} onDragStart={(event) => onDragStart(event as any)} onDragEnd={(event) => onDragEnd(event as any)} sensors={sensors}>
        {children}
        <DragOverlay dropAnimation={{
              duration: 400,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeId ? (
                <DynamicElement id={activeId} listIndex={undefined} key={undefined} draggable={false} droppable={false} mode="preview" />
              ) : null}
            </DragOverlay> 
      </DndContext>
  );
};

export default DragAndDrop;
