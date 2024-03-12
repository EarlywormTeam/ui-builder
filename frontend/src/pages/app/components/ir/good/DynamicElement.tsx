import { useSelector } from "react-redux";
import { RootState } from 'src/redux/store';
import { ComponentConfig, ProviderConfig, ListConfig } from "./config"
import { DynamicComponent } from "./DynamicComponent";
import { DynamicProvider } from "./DynamicProvider";
import { DynamicList } from "./DynamicList";

export function DynamicElement({id, listIndex, draggable, droppable, mode}: {id: string, listIndex: string | undefined, draggable: boolean, droppable: boolean, mode?: 'preview' | 'editing'}) {
  
  const realConfig: ComponentConfig | ProviderConfig | ListConfig = useSelector((state: RootState) => state.canvas.componentState.present.configMap[id]);
  const demoConfig: ComponentConfig | ListConfig = useSelector((state: RootState) => state.canvas.demoConfigMap[id]);
  const config = realConfig || demoConfig;
  const childrenIds: Array<string> = useSelector((state: RootState) => state.canvas.componentState.present.childrenMap[id]) || [];

  if (!config) {
    return null;
  }

  const hasChildren = childrenIds?.length > 0;

  if ('actions' in config && 'initialState' in config) {
    // This is a ProviderConfig
    return (
      <DynamicProvider id={id} listIndex={listIndex} config={config as ProviderConfig}>
        {hasChildren && childrenIds.map(cid => <DynamicElement listIndex={listIndex} key={cid} id={cid} draggable={draggable} droppable={droppable} mode={mode} />)}
      </DynamicProvider>
    );
  } else if ('generator' in config) {
    // This is a ListCOnfig
    return (
      <DynamicList id={id} listIndex={listIndex} config={config as ListConfig} draggable={draggable} droppable={droppable} mode={mode}/>
    )
  } else {
    // This is a ComponentConfig
    return (
      <DynamicComponent id={id} listIndex={listIndex} config={config as ComponentConfig} childrenIds={childrenIds} draggable={draggable} droppable={droppable} mode={mode}/>
    );
  }
}

