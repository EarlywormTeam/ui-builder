import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ComponentConfig, ProviderDependencyConfig, FunctionConfig } from "./config";
import { DynamicContextConsumer } from "./DynamicContextConsumer";
import { useComponent } from './useComponent';
import withDraggable from "../../DraggableComponent";
import withDroppable from "../../DroppableComponent";
import { DynamicElement } from "./DynamicElement";
import { add, addSelectedId, setSelectedIds } from 'src/redux/slice/canvasSlice';
import { RootState } from "src/redux/store";

const useIsSelected = (id: string) => {
  const selectedIds = useSelector((state: RootState) => state.canvas.selectedIds);
  return selectedIds.includes(id);
}

const extractContextIdsFromEvents = (events: { actions: { contextId: string }[] }[]) => {
  return [...new Set(events
    .map(e => e.actions.map(a => a.contextId))
    .flat())]; // Flatten and then remove duplicates using Set
}

const extractContextIdsFromAttributes = (attributes: Record<string, FunctionConfig | string>) => {
  return Object.values(attributes)
    .filter((a): a is FunctionConfig => typeof a !== 'string')
    .map(a => a.args.map(ad => ad.contextId))
    .reduce((acc, val) => acc.concat(val), []);
}

const parseActionPayload = (event: React.MouseEvent, contexts: Record<string, any>, actionPayload: string | FunctionConfig | null) => {
  if (actionPayload) {
    if (typeof actionPayload === 'string') {
      return JSON.parse(actionPayload);
    } else {
      return executeFunctionConfig({event}, contexts, actionPayload);
    }
  }
  return null;
}

const executeFunctionConfig = (scope: Record<string, any>, contexts: Record<string, string>, func: FunctionConfig) => {
  let args = [];
  if (func.args) {
    args = func.args.map((a: ProviderDependencyConfig) => convertProviderDependencyConfigToValue(contexts, a));
  } 
  // eslint-disable-next-line no-new-func
  return Function(...Object.keys(scope), 'args', func.body)(...Object.values(scope), args);
}

// attributes can be either a string or a FunctionConfig.
// If they are a FunctionConfig, we can use the context to
// get the value.
const resolveAttributes = (attributes: Record<string, FunctionConfig | string>, contexts: Record<string, any>): Record<string, string> => {
  return Object.keys(attributes).reduce((acc: Record<string, string>, key: string) => {
    const value = attributes[key];
    if (typeof value === 'string' || !value) {
      acc[key] = value;
    } else {
      acc[key] = executeFunctionConfig({}, contexts, value); 
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
              payload: parseActionPayload(event, contexts, action.actionPayload),
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

export const DynamicComponent: React.FC<PropsWithChildren<{id: string, config: ComponentConfig, childrenIds: string[], draggable: boolean, droppable: boolean, mode?: 'preview' | 'editing'} & React.HTMLAttributes<HTMLElement>>> = ({id, config, childrenIds, draggable, droppable, children, mode, ...props}) => {
  const displayMode = mode || 'preview';
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(config.attributes.textcontent) || '';
  const isSelected = useIsSelected(id);
  const [localIsSelected, setLocalIsSelected] = useState(isSelected); // Local state for immediate UI feedback

  useEffect(() => {
    setLocalIsSelected(isSelected);
  }, [isSelected]);

  useEffect(() => {
    if (displayMode === 'editing') {
      const handleClickOutside = (ev: MouseEvent) => {
        const isClickInsideTextInput = ev.target instanceof HTMLInputElement && ev.target.classList.contains('editable-text-input');
        if (!isClickInsideTextInput) {
          setIsEditing(false);
        }
      }
      if (isEditing) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }
  }, [isEditing, displayMode]);

  useEffect(() => {
    if (displayMode === 'editing' && !isEditing && config.attributes.textcontent !== editContent) {
      dispatch(add({ id, config: { ...config, attributes: { ...config.attributes, textcontent: editContent } } }));
    }
  }, [displayMode, isEditing, editContent, config, id, dispatch]);

  const toggleIsSelected = (isSelected: boolean) => {
    if (lastClickEventRef.current && (lastClickEventRef.current.metaKey || lastClickEventRef.current.ctrlKey)) { // Check if Cmd (metaKey) or Ctrl (ctrlKey) is pressed
      dispatch(addSelectedId(id));
    } else {
      dispatch(setSelectedIds([id]));
    }
  };

  // useEffect(() => {
  //   if (!isEditing && localIsSelected !== isSelected) {
  //     toggleIsSelected();
  //   }
  // }, [localIsSelected, isEditing, isSelected, toggleIsSelected])

  const handleDoubleClick: React.MouseEventHandler<HTMLElement> = (event) => {
    setIsEditing(current => !current);
    event.stopPropagation();
  }

  const clickDownTimeRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number | null>(null);
  const lastClickEventRef = useRef<React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement> | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        (Date.now() - (lastClickTimeRef.current || 0)) > 200 // don't interfere with a double click
      ) {
      console.log('single click', Date.now() - (lastClickTimeRef.current || 0));

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      clickTimeoutRef.current = setTimeout(() => {
        toggleIsSelected(!localIsSelected);
        clickTimeoutRef.current = null;
      }, 205);

      setLocalIsSelected(true) // Cast event type if necessary
      

       // Adjust the timeout duration if needed, ensuring it's slightly longer than the double click detection window
    } else if (lastClickTimeRef.current && (Date.now() - lastClickTimeRef.current) < 200) {
      console.log('double click')
      // If the time difference between the last click and this one is less than 250ms, consider it a double click
      handleDoubleClick(event as React.MouseEvent<HTMLElement>); // Cast event type if necessary
    }

    lastClickTimeRef.current = Date.now();
  };
  
  const onMouseDown = (isEditing || displayMode === 'preview') ? undefined : handleMouseDown;
  const onMouseUp = (isEditing || displayMode === 'preview') ? undefined : handleMouseUp;

  const eventContextIds = extractContextIdsFromEvents(config.events);
  const attributeContextIds = extractContextIdsFromAttributes(config.attributes);
  const contextIds = [...new Set([...eventContextIds, ...attributeContextIds])];

  const Component = useComponent(config.type);
  if (!Component) {
    return null;
  }

  return (
    <DynamicContextConsumer
      contextIds={contextIds}
      render={(contexts) => {
        const attributes = resolveAttributes(config.attributes, contexts);
        let convertedHandlers = convertEventHandlers(config.events, contexts);
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
          return <WrappedComponent id={id} {...convertedHandlers} {...config.attributes} {...props}/>;
        }

        const atts = {
          ...config.attributes,
          className: localIsSelected ? `${config.attributes.className || ''} shadow-xl outline outline-2 outline-offset-2 outline-blue-500 transform scale-103` : config.attributes.className
        }

        return (
          <WrappedComponent id={id} {...convertedHandlers} {...atts} {...props}>
            <Filler
              hasChildren={childrenIds.length > 0}
              childrenIds={childrenIds}
              isEditing={isEditing}
              editContent={typeof editContent !== 'object' ? editContent : executeFunctionConfig({}, contexts, editContent)}
              content={attributes.textcontent || ''}
              setEditContent={setEditContent}
              setIsEditing={setIsEditing}
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

const Filler: React.FC<FillerProps> = ({ hasChildren, childrenIds, isEditing, editContent, setEditContent, content, setIsEditing, draggable, droppable, displayMode }) => {
  if (hasChildren) {
    return (
      <>
        {childrenIds.map((cid: string) => <DynamicElement key={cid} id={cid} draggable={draggable} droppable={droppable} mode={displayMode} />)}
      </>
    );
  } else if (isEditing) {
    return (
      <input
        type="text"
        className="bg-white text-black border-1 border-gray-300 editable-text-input"
        value={editContent}
        onClick={(ev: React.MouseEvent<HTMLInputElement>) => ev.stopPropagation()}
        onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditContent(ev.target.value)}
        onKeyDown={(ev: React.KeyboardEvent<HTMLInputElement>) => ev.key === 'Enter' && setIsEditing(false)}
        onBlur={() => setIsEditing(false)}
        autoFocus
      />
    );
  }
  return <>{content}</>;
};