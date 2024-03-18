import { useState } from 'react';
import { DndContext, useSensors, useSensor, PointerSensor, DragOverlay, DragEndEvent, DragMoveEvent, pointerWithin } from '@dnd-kit/core';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/redux/store';
import { add, insertChild, removeId } from 'src/redux/slice/canvasSlice';
import { DynamicElement  } from './components/ir/good/DynamicElement';
import { ComponentConfig, ProviderConfig, ListConfig } from './components/ir/good/config';
// import App from './AppInternal';
import { useDragAndDropContext } from './components/DragAndDropContext';
import { ComponentMapRow } from './components/ComponentMap';

const calculateOverIdAndIndex = (event: DragMoveEvent | DragEndEvent, configMap: { [key: string]: ComponentConfig | ProviderConfig | ListConfig }, childrenMap: { [key: string]: string[] }) => {
  const { active, collisions } = event;

  let overId = null;
  let index = null;
  
  let pointerLocation = {x: 0, y: 0};
  if (event.activatorEvent instanceof MouseEvent) {
    pointerLocation = {x: event.activatorEvent.x + event.delta.x, y: event.activatorEvent.y + event.delta.y}
    console.log('pointer location', pointerLocation);
  }
  if (!collisions || !collisions.filter(c => c !== undefined).length) { return {overId, index}; }
  // calculate inner drop area of top collision as maximum of 65% width and height, centered and 45.
  const dropRect = collisions[0].data?.droppableContainer.rect.current;
  if (!dropRect) { return {overId, index}; }

  if (collisions[0].id.toString().startsWith('map-')) {
    let ci = 0;
      while (true) {
        if (ci >= collisions.length) { break; }
        if (collisions[ci].id.toString() !== active.id) {
          overId = collisions[ci].id.toString();
          break;
        }
        ci += 1;
      }
      return {overId, index: 0};
  }

  // figure out the type of container
  let containerType = '';
  if (collisions.length > 1) {
    const containerId = collisions[1].id;
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

  const innerDropWidth = containerType === 'flex-row' ? Math.max(dropRect.width * .95, 20) : dropRect.width;
  const innerDropHeight = containerType === 'flex-col' ? Math.max(dropRect.height * .95, 20) : dropRect.height;
  const innerDropRect = {
    x: dropRect.left + ((dropRect.width - innerDropWidth) / 2),
    y: dropRect.top + ((dropRect.height - innerDropHeight) / 2),
    width: innerDropWidth,
    height: innerDropHeight,
  };

  if (collisions[0].id !== active.id && pointerLocation.x > innerDropRect.x && pointerLocation.x < innerDropRect.x + innerDropRect.width && pointerLocation.y > innerDropRect.y && pointerLocation.y < innerDropRect.y + innerDropRect.height) {
    overId = collisions[0].id;
  } else if (collisions.length > 1) {
    let ci = 1;
    while (collisions[ci] && collisions[ci].id === active.id) {
      ci += 1;
    }
    if (!collisions[ci]) { return {overId, index}; }
    
    overId = collisions[ci].id;

    const parentChildren = childrenMap[overId.toString()];
    const collisionIndex = parentChildren.indexOf(collisions[0].id.toString());

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
  
  return {overId, index};
}

const DragAndDrop = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const demoConfigMap = useSelector((state: RootState) => state.canvas.demoConfigMap);
  // Be careful with this - since list updates the childrenMap in real time in preview mode, this has a conflict and causes bad re-renders.
  const childrenMap = useSelector((state: RootState) => state.canvas.componentState.present.childrenMap)
  const configMap = useSelector((state: RootState) => state.canvas.componentState.present.configMap);
  
  const dndContext = useDragAndDropContext();

  const onDragStart = (event: { active: { id: string; children?: React.ReactNode[] } }) => {
    if (event.active.id.toString().endsWith('canvas')) { return; }
    setActiveId(event.active.id);
  }

  const onDragMove = (event: DragMoveEvent) => {
    if (event.active.id.toString().endsWith('canvas')) { return; }
    const { overId } = calculateOverIdAndIndex(event, configMap, childrenMap);
    dndContext.setOverComponentId(overId?.toString() || null);
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    if (active.id.toString().endsWith('canvas')) { return; }

    const {overId, index} = calculateOverIdAndIndex(event, configMap, childrenMap);

    if (!overId) { return }

    const activeIdString = active.id.toString();
    let newId = activeIdString;
    if (newId.startsWith('map-')) {
      newId = newId.replace('map-', '');
    }
    let cleanedOverId = overId.toString();
    if (cleanedOverId.startsWith('map-')) {
      cleanedOverId = cleanedOverId.replace('map-', '');
    }
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
    dispatch(insertChild({id: newId, parentId: cleanedOverId, index: index}));
    setActiveId(null);
    dndContext.setOverComponentId(null);
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
        {activeId && (!activeId.startsWith('map-') ? (
          <DynamicElement id={activeId} listIndex={undefined} key={undefined} draggable={false} droppable={false} mode="preview" />
        ) : (
          <ComponentMapRow id={activeId} level={1} hasChildren={false} isContracted={false} configMap={configMap} toggleContract={() => {}} />
        ))}
      </DragOverlay>
    </DndContext>
  );
};

export default DragAndDrop;
