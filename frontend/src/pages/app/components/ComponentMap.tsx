import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/redux/store';
import { setSelectedIds } from 'src/redux/slice/canvasSlice';
import { useDragAndDropContext } from './DragAndDropContext';
import withDroppable from './DroppableComponent';
import withDraggable from './DraggableComponent';
import { ComponentConfig, ListConfig, ProviderConfig } from './ir/good/config';

const ComponentList: React.FC = () => {
  const [contractedIds, setContractedIds] = useState<string[]>([]);
  const childrenMap = useSelector((state: RootState) => state.canvas.componentState.present.childrenMap);
  const configMap = useSelector((state: RootState) => state.canvas.componentState.present.configMap);

  const toggleContract = useCallback((id: string) => {
    setContractedIds(currentContractedIds =>
      currentContractedIds.includes(id)
        ? currentContractedIds.filter(contractedId => contractedId !== id)
        : [...currentContractedIds, id]
    );
  }, []);

  const renderComponentsFlat = useCallback((id: string, level: number, components: JSX.Element[] = []) => {
    const children = childrenMap[id] || [];
    const isContracted = contractedIds.includes(id);
    const hasChildren = children.length > 0;
    
    const DraggableDroppableComponent = withDraggable(withDroppable(ComponentMapRow));
    
    components.push(
      <DraggableDroppableComponent key={`map-${id}`} id={`map-${id}`} level={level} hasChildren={hasChildren} isContracted={isContracted} configMap={configMap} toggleContract={toggleContract} />
    );

    if (!isContracted) {
      children.forEach((childId: string) => renderComponentsFlat(childId, level + 1, components));
    }

    return components;
  }, [childrenMap, configMap, contractedIds, toggleContract]);

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto gap-2 p-2 ">
      {renderComponentsFlat("canvas", 0)}
    </div>
  );
};

interface ComponentWrapperProps extends React.PropsWithChildren<React.HTMLAttributes<HTMLElement>> {
  id: string;
  level: number;
  hasChildren: boolean;
  isContracted: boolean;
  configMap: Record<string, ComponentConfig | ProviderConfig | ListConfig>;
  toggleContract: (id: string) => void;
}

const useOverComponent = (ids: string[]) => {
  const overComponentMap = useDragAndDropContext().overComponents;
  const res = ids.map(id => {
    return overComponentMap.get(id) || false;
  })
  return res.filter(Boolean).length > 0;
}

export const ComponentMapRow = React.forwardRef<HTMLElement, ComponentWrapperProps>(({ id, level, hasChildren, isContracted, configMap, toggleContract, ...props }, ref) => {
  // console.log('re-rendering row', id);
  const indentStyle = { paddingLeft: `${level * 20}px` };
  const dispatch = useDispatch();
  
  const selectedIds = useSelector((state: RootState) => Object.keys(state.canvas.selectedIds).filter(id => state.canvas.selectedIds[id]));

  const componentId = id.replace('map-', '');
  const isDropHovered = useOverComponent([id, componentId]);
  const isSelected = selectedIds.includes(componentId);
  const componentConfig = configMap[componentId];
  let componentType = 'Canvas';
  if (componentId !== 'canvas') {
    componentType = 'type' in componentConfig ? componentConfig.type : 'name' in componentConfig ? componentConfig.name : 'List';
  }

  const handleSelect = useCallback((event: React.MouseEvent) => {
    const mapId = id;
    const actualId = mapId.replace('map-', '');
    event.stopPropagation();
    let newSelectedIds;
    if (event.metaKey || event.ctrlKey) {
      newSelectedIds = selectedIds.includes(actualId) ? selectedIds.filter(selectedId => selectedId !== actualId) : [...selectedIds, actualId];
    } else {
      newSelectedIds = selectedIds.includes(actualId) ? [] : [actualId];
    }
    dispatch(setSelectedIds(newSelectedIds));
  }, [dispatch, selectedIds, id]);

  return (
    <div className={`flex ${isSelected ? 'bg-blue-200' : ''} ${isDropHovered ? 'bg-slate-200' : ''}`} onClick={handleSelect} ref={ref as any} {...props}>
      <div style={{...indentStyle, cursor: 'pointer', userSelect: 'none'}} className='flex gap-1 w-full'>
        {hasChildren && <button className={"w-4 h-4"} onClick={() => hasChildren && toggleContract(id)}>{isContracted ? '▶' : '▼'}</button>}
          <span style={{ userSelect: 'none' }} className={'w-full'}>{componentType.charAt(0).toUpperCase() + componentType.slice(1)}</span>
      </div> 
    </div>
  );
});

export default ComponentList;
