import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/redux/store';
import { setSelectedIds } from 'src/redux/slice/canvasSlice';
import { useDragAndDropContext } from './DragAndDropContext';

const ComponentList: React.FC = () => {
  const [contractedIds, setContractedIds] = useState<string[]>([]);
  const overId = useDragAndDropContext().overComponentId;
  const childrenMap = useSelector((state: RootState) => state.canvas.componentState.present.childrenMap);
  const selectedIds = useSelector((state: RootState) => Object.keys(state.canvas.selectedIds).filter(id => state.canvas.selectedIds[id]));
  const configMap = useSelector((state: RootState) => state.canvas.componentState.present.configMap);
  const dispatch = useDispatch();

  const toggleContract = useCallback((id: string) => {
    setContractedIds(currentContractedIds =>
      currentContractedIds.includes(id)
        ? currentContractedIds.filter(contractedId => contractedId !== id)
        : [...currentContractedIds, id]
    );
  }, []);

  const handleSelect = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    let newSelectedIds;
    if (event.metaKey || event.ctrlKey) {
      newSelectedIds = selectedIds.includes(id) ? selectedIds.filter(selectedId => selectedId !== id) : [...selectedIds, id];
    } else {
      newSelectedIds = selectedIds.includes(id) ? selectedIds.filter(selectedId => selectedId !== id) : [id];
    }
    dispatch(setSelectedIds(newSelectedIds));
  }, [dispatch, selectedIds]);

  const ComponentRenderer = useCallback(({ id, level }: { id: string; level: number }) => {
    const children = childrenMap[id] || [];
    const isContracted = contractedIds.includes(id);
    const hasChildren = children.length > 0;
    const componentConfig = configMap[id];
    const indentStyle = { paddingLeft: `${level * 20}px` };

    let componentType = 'Canvas';
    if (id !== 'canvas') {
      componentType = 'type' in componentConfig ? componentConfig.type : 'name' in componentConfig ? componentConfig.name : 'List';
    }

    return (
      <div key={id} className="flex flex-col w-full">
        <div style={{...indentStyle, cursor: 'pointer', userSelect: 'none'}} className={`flex gap-1 border-b border-gray-300 w-full ${selectedIds.includes(id) ? 'bg-blue-100' : ''} ${overId === id ? 'bg-slate-200' : ''}`} onClick={(event) => handleSelect(id, event)} >
          {hasChildren && <button className={"w-4 h-4"} onClick={() => hasChildren && toggleContract(id)}>{isContracted ? '▶' : '▼'}</button>}
          <span style={{ userSelect: 'none' }} className={'w-full'}>{componentType.charAt(0).toUpperCase() + componentType.slice(1)}</span>
        </div>
        {!isContracted && children.map((childId: string) => <ComponentRenderer key={childId} id={childId} level={level + 1} />)}
      </div>
    );
  }, [childrenMap, contractedIds, configMap, selectedIds, overId, handleSelect, toggleContract]);

  return (
    <div className="flex h-full w-full gap-2 p-2">
      <ComponentRenderer key="canvas" id="canvas" level={0} />
    </div>
  );
};

export default ComponentList;

