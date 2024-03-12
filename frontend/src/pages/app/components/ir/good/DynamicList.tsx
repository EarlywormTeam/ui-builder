import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { ListConfig, FunctionConfig, ProviderConfig, ProviderDependencyConfig, ComponentConfig } from "./config";
import { DynamicContextConsumer } from "./DynamicContextConsumer";
import { DynamicElement } from "./DynamicElement";
import { add, insertChild, removeId } from "src/redux/slice/canvasSlice";


const extractContextIdsFromListConfig = (config: ListConfig) => {
  return config.generator.args.map(a => a.contextId);
}

export function DynamicList({id, listIndex, config, draggable, droppable, mode}: {id: string, listIndex: string | undefined, config: ListConfig, draggable: boolean, droppable: boolean, mode?: 'preview' | 'editing'}) {

  const contextIds = extractContextIdsFromListConfig(config);
  const DynamicElementWithRegistration = withDynamicRegistration(DynamicElement);

  return (
    <DynamicContextConsumer
      contextIds={contextIds}
      render={(contexts) => {
        return (
          <>
            { executeFunctionConfig({listIndex: isNaN(Number(listIndex)) ? undefined : Number(listIndex)}, contexts, config.generator).map((data: any, i: number) => {
              const generatedId = `${id}-${i}`;
              
              // no insert here because now this state is dependent on program state, not predefined state.
              return <DynamicElementWithRegistration id={generatedId} config={config.listReusableChildConfig} key={i.toString()} listIndex={i.toString()} draggable={draggable} droppable={droppable} mode={mode}/>
            })}
          </>
        )
      }}
    />
  )
}

const withDynamicRegistration = (WrappedComponent: React.ComponentType<any>) => {
  return ({ id, config, listIndex, ...props }: { id: string, config: ProviderConfig | ComponentConfig, listIndex: string, [key: string]: any }) => {
    const dispatch = useDispatch();
    const hasRegisteredRef = useRef(false);

    const registerConfigAndChildren = useCallback((configId: string, config: ProviderConfig | ComponentConfig, parentId: string | null) => {
      dispatch(add({ id: configId, config }));
      if (parentId) {
        dispatch(insertChild({id: configId, parentId, index: null}))
      }
      if ('children' in config && Array.isArray(config.children)) {
        config.children.forEach((child: any) => {
          if (child && child.id && child.config) {
            registerConfigAndChildren(child.id, child.config, configId);
          }
        });
      }
    }, [dispatch]);

    useEffect(() => {
      if (!hasRegisteredRef.current) {
        hasRegisteredRef.current = true;
        registerConfigAndChildren(id, config, null);
      }
      return () => {
        hasRegisteredRef.current = false;
        dispatch(removeId({id}));
      }
    }, [id, config, dispatch, registerConfigAndChildren]);

    return <WrappedComponent {...props} id={id} key={listIndex} listIndex={listIndex} /*key={registeredHash}*/ />;
  };
};

const executeFunctionConfig = (scope: Record<string, any>, contexts: Record<string, string>, func: FunctionConfig) => {
  let args = [];
  if (func.args) {
    args = func.args.map((a: ProviderDependencyConfig) => convertProviderDependencyConfigToValue(contexts, a));
  } 
  // eslint-disable-next-line no-new-func
  return Function(...Object.keys(scope), 'args', func.body)(...Object.values(scope), args);
}

const convertProviderDependencyConfigToValue = (contexts: any, config: ProviderDependencyConfig) => {
  const contextValue = contexts[config.contextId]['state'];
  let attValue = contextValue;
  for (const sel of config.selector) {
    attValue = attValue[sel];
  }
  if (config.modifier) {
    // eslint-disable-next-line no-new-func
    attValue = Function('args', config.modifier.body)([attValue]);
  }
  return attValue;
}