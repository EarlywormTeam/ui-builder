import { useSelector } from "react-redux";
import { RootState } from 'src/redux/store';
import { ComponentConfig, ProviderConfig } from "./config"
import { DynamicComponent } from "./DynamicComponent";
import { DynamicProvider } from "./DynamicProvider";

export function DynamicElement({id, draggable, droppable, mode}: {id: string, draggable: boolean, droppable: boolean, mode?: 'preview' | 'editing'}) {
  
  const state = useSelector((state: RootState) => state.canvas);
  const config: ComponentConfig | ProviderConfig = state.configMap[id];
  const childrenIds: Array<string> = state.childrenMap[id] || [];

  if (!config) {
    return null;
  }

  const hasChildren = childrenIds?.length > 0;

  if ('actions' in config && 'initialState' in config) {
    // This is a ProviderConfig
    return (
      <DynamicProvider id={id} config={config as ProviderConfig}>
        {hasChildren && childrenIds.map(cid => <DynamicElement id={cid} draggable={draggable} droppable={droppable} mode={mode} />)}
      </DynamicProvider>
    );
  } else {
    // This is a ComponentConfig
    return (
      <DynamicComponent id={id} config={config as ComponentConfig} childrenIds={childrenIds} draggable={draggable} droppable={droppable} mode={mode}>
        
      </DynamicComponent>
    );
  }
}

