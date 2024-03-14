import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ComponentConfig, ProviderDependencyConfig, FunctionConfig } from "./config";
import { DynamicContextConsumer } from "./DynamicContextConsumer";
import { useComponent } from './useComponent';
import withDraggable from "../../DraggableComponent";
import withDroppable from "../../DroppableComponent";
import { DynamicElement } from "./DynamicElement";
import { add, addSelectedId, setSelectedIds, setTextEditingId, setLastClickTime } from 'src/redux/slice/canvasSlice';
import { RootState } from "src/redux/store";

const useIsTextEditing = (id: string) => {
  const textEditingId = useSelector((state: RootState) => state.canvas.textEditingId);
  return textEditingId === id;
}

const extractContextIdsFromEvents = (events: { actions: { contextId: string, actionPayload: { args: Array<{ contextId: string }>} | string | null }[] }[]) => {
  return [...new Set(events
    .map(e => e.actions.map(a => {
      const payloadFunction = typeof a.actionPayload === 'object' ? a.actionPayload as FunctionConfig : null;
      if (!payloadFunction) {
        return [a.contextId];
      }
      return [a.contextId].concat(payloadFunction.args.map(ad => ad.contextId));
    }))
    .flat(2))]; // Flatten and then remove duplicates using Set
}

const extractContextIdsFromAttributes = (attributes: Record<string, FunctionConfig | string>) => {
  return Object.values(attributes)
    .filter((a): a is FunctionConfig => typeof a !== 'string')
    .map(a => a.args.map(ad => ad.contextId))
    .reduce((acc, val) => acc.concat(val), []);
}

const parseActionPayload = (key: string | undefined, event: React.MouseEvent, contexts: Record<string, any>, actionPayload: string | FunctionConfig | null) => {
  if (actionPayload) {
    if (typeof actionPayload === 'string') {
      return JSON.parse(actionPayload);
    } else {
      return executeFunctionConfig({event, listIndex: isNaN(Number(key)) ? undefined : Number(key)}, contexts, actionPayload);
    }
  }
  return null;
}

const executeFunctionConfig = (scope: Record<string, any>, contexts: Record<string, string>, func: FunctionConfig) => {
  let args = [];
  if (func.args) {
    args = func.args.map((a: ProviderDependencyConfig) => convertProviderDependencyConfigToValue(contexts, a));
  } 
  console.log(scope, args, func.body);
  // eslint-disable-next-line no-new-func
  return Function(...Object.keys(scope), 'args', func.body)(...Object.values(scope), args);
}

// attributes can be either a string or a FunctionConfig.
// If they are a FunctionConfig, we can use the context to
// get the value.
const resolveAttributes = (key: string | undefined, attributes: Record<string, FunctionConfig | string>, contexts: Record<string, any>): Record<string, string> => {
  return Object.keys(attributes).reduce((acc: Record<string, string>, okey: string) => {
    const value = attributes[okey];
    if (typeof value === 'string' || !value) {
      acc[okey] = value;
    } else {
      acc[okey] = executeFunctionConfig({listIndex: isNaN(Number(key)) ? undefined : Number(key)}, contexts, value); 
    }
    return acc;
  }, {});
}

interface EventConfig {
  name: string;
  actions: ActionConfig[];
}

interface ActionConfig {
  contextId: string;
  actionName: string;
  actionPayload: string | FunctionConfig | null;
}

interface Contexts {
  [key: string]: {
    dispatch: (action: { type: string; payload?: any }) => void;
  };
}

const convertEventHandlers = (
  key: string | undefined,
  events: EventConfig[],
  contexts: Contexts
): Record<string, React.MouseEventHandler<HTMLElement>> => {
  let convertedHandlers: Record<string, React.MouseEventHandler<HTMLElement>> = {};
  events.forEach((configEvent: EventConfig) => {
    convertedHandlers[configEvent.name] = ((contexts: Contexts) => {
      return (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        console.log('event', event);
        configEvent.actions.forEach((action: ActionConfig) => {
          if (contexts[action.contextId] && typeof contexts[action.contextId].dispatch === 'function') {
            contexts[action.contextId].dispatch({
              type: action.actionName,
              payload: parseActionPayload(key, event, contexts, action.actionPayload),
            });
          } else {
            console.error(`Context with id ${action.contextId} not found or dispatch not a function`);
          }
        });
      };
    })(contexts);
  });

  return convertedHandlers;
};

export const DynamicComponent: React.FC<PropsWithChildren<{id: string, listIndex: string | undefined, config: ComponentConfig, childrenIds: string[], draggable: boolean, droppable: boolean, mode?: 'preview' | 'editing'} & React.HTMLAttributes<HTMLElement>>> = ({id, listIndex, config, childrenIds, draggable, droppable, children, mode, ...props}) => {
  const displayMode = mode || 'preview';
  const dispatch = useDispatch();
  const isTextEditing = useIsTextEditing(id);
  const [editContent, setEditContent] = useState(config.attributes.textcontent) || '';
  const isSelected = useSelector((state: RootState) => state.canvas.selectedIds[id]);
  const lastClickTime = useSelector((state: RootState) => state.canvas.lastClickTime[id]);

  useEffect(() => {
    if (displayMode === 'editing') {
      const handleClickOutside = (ev: MouseEvent) => {
        const isClickInsideTextInput = ev.target instanceof HTMLInputElement && ev.target.classList.contains('editable-text-input');
        if (!isClickInsideTextInput) {
          if (config.attributes.textcontent !== editContent) {
            dispatch(add({ id, config: { ...config, attributes: { ...config.attributes, textcontent: editContent } } }));
          }
          dispatch(setTextEditingId(null));
        }
      }
      if (isTextEditing) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }
  }, [isTextEditing, editContent, config, displayMode, dispatch, id]);

  const toggleIsSelected = (isSelected: boolean) => {
    if (lastClickEventRef.current && (lastClickEventRef.current.metaKey || lastClickEventRef.current.ctrlKey)) { // Check if Cmd (metaKey) or Ctrl (ctrlKey) is pressed
      dispatch(addSelectedId(id));
    } else {
      dispatch(setSelectedIds([id]));
    }
  };

  const handleDoubleClick: React.MouseEventHandler<HTMLElement> = (event) => {
    dispatch(setTextEditingId(id));
    event.stopPropagation();
  }

  const clickDownTimeRef = useRef<number | null>(null);
  const lastClickEventRef = useRef<React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement> | null>(null);

  const handleMouseDown = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    event.stopPropagation();
    clickDownTimeRef.current = Date.now();
    lastClickEventRef.current = event;
  };
  
  const handleMouseUp = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    event.stopPropagation();
    // Only handle single click if double click hasn't been handled
    if (
        clickDownTimeRef.current && 
        (Date.now() - clickDownTimeRef.current) < 100 && // make sure this isn't a drag
        (Date.now() - (lastClickTime || 0)) > 200 // don't interfere with a double click
      ) {
      console.log('single click', Date.now() - (lastClickTime || 0));

        toggleIsSelected(true);

       // Adjust the timeout duration if needed, ensuring it's slightly longer than the double click detection window
    } else if (lastClickTime && (Date.now() - lastClickTime) < 200) {
      console.log('double click', Date.now() - lastClickTime)
      // If the time difference between the last click and this one is less than 250ms, consider it a double click
      handleDoubleClick(event as React.MouseEvent<HTMLElement>); // Cast event type if necessary
    }

    dispatch(setLastClickTime({id: id, time: Date.now()}));
  };
  
  const onMouseDown = (isTextEditing || displayMode === 'preview') ? undefined : handleMouseDown;
  const onMouseUp = (isTextEditing || displayMode === 'preview') ? undefined : handleMouseUp;

  const eventContextIds = extractContextIdsFromEvents(config.events);
  const attributeContextIds = extractContextIdsFromAttributes(config.attributes);
  const contextIds = [...new Set([...eventContextIds, ...attributeContextIds].filter(id => id !== undefined))];

  const Component = useComponent(config.type);
  if (!Component) {
    console.error('Comonent not found', id, config);
    return null;
  }

  return (
    <DynamicContextConsumer
      contextIds={contextIds}
      render={(contexts) => {
        const attributes = resolveAttributes(listIndex, config.attributes, contexts);
        let convertedHandlers = convertEventHandlers(listIndex, config.events, contexts);
        if (onMouseDown) {
          convertedHandlers['onMouseDown'] = onMouseDown;
          convertedHandlers['onTouchStart'] = onMouseDown;
        }
        if (onMouseUp) {
          convertedHandlers['onMouseUp'] = onMouseUp;
          convertedHandlers['onTouchEnd'] = onMouseUp;
        }

        // textarea & input can't have children
        const adjDroppable = droppable && !['textarea', 'input'].includes(config.type);
        const WrappedComponent = withDragAndDrop(draggable, adjDroppable, Component);

        if (config.type === 'textarea' || config.type === 'input') {
          return <WrappedComponent id={id} {...convertedHandlers} {...attributes} {...props}/>;
        }

        const atts = {
          ...attributes,
          className: isSelected ? `${attributes.className || ''} shadow-xl outline outline-2 outline-offset-2 outline-blue-500 transform scale-103` : attributes.className
        }

        const setEditingHandler = (editing: boolean) => {
          if (editContent !== attributes.textcontent) {
            dispatch(add({ id, config: { ...config, attributes: { ...config.attributes, textcontent: editContent } } }));
          }
          dispatch(setTextEditingId(editing ? id : null));
        }

        return (
          <WrappedComponent id={id} listIndex={listIndex} {...convertedHandlers} {...atts} {...props}>
            <Filler
              listIndex={listIndex}
              hasChildren={childrenIds.length > 0}
              childrenIds={childrenIds}
              isEditing={isTextEditing}
              editContent={typeof editContent !== 'object' ? editContent : executeFunctionConfig({listIndex: isNaN(Number(listIndex)) ? undefined : Number(listIndex)}, contexts, editContent)}
              content={attributes.textcontent || ''}
              setEditContent={setEditContent}
              setIsEditing={setEditingHandler}
              draggable={draggable}
              droppable={droppable}
              displayMode={displayMode}
            />
          </WrappedComponent>
        );
      }}
    />
  );
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

const withDragAndDrop = (drag: boolean, drop: boolean, Comp: React.ElementType) => {
  if (drag && drop) {
    return withDraggable(withDroppable(Comp));
  } else if (drag) {
    return withDraggable(Comp);
  } else if (drop) {
    return withDroppable(Comp);
  } else {
    return Comp;
  }
};

interface FillerProps {
  listIndex: string | undefined;
  hasChildren: boolean;
  childrenIds: string[];
  isEditing: boolean;
  editContent: string;
  content: string | null;
  setEditContent: (value: string) => void;
  setIsEditing: (value: boolean) => void;
  draggable: boolean;
  droppable: boolean;
  displayMode: 'preview' | 'editing' | undefined;
}

const Filler: React.FC<FillerProps> = ({ listIndex, hasChildren, childrenIds, isEditing, editContent, setEditContent, content, setIsEditing, draggable, droppable, displayMode }) => {
  if (hasChildren) {
    return (
      <>
        {childrenIds.map((cid: string) => <DynamicElement listIndex={listIndex} id={cid} draggable={draggable} droppable={droppable} mode={displayMode} key={listIndex + cid} />)}
      </>
    );
  } else if (isEditing) {
    return (
      <input
        type="text"
        className="bg-white text-black border-1 border-gray-300 editable-text-input"
        value={editContent}
        onClick={(ev: React.MouseEvent<HTMLInputElement>) => ev.stopPropagation()}
        onChange={(ev: React.ChangeEvent<HTMLInputElement>) => { 
          setEditContent(ev.target.value)}
        }
        onKeyDown={(ev: React.KeyboardEvent<HTMLInputElement>) => ev.key === 'Enter' && setIsEditing(false)}
        onBlur={() => setIsEditing(false)}
        autoFocus
      />
    );
  }
  return <>{content}</>;
};