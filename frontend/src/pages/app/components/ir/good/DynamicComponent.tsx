import React, { PropsWithChildren, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ComponentConfig, ProviderDependencyConfig } from "./config";
import { DynamicContextConsumer } from "./DynamicContextConsumer";
import { useComponent } from './useComponent';
import withDraggable from "../../DraggableComponent";
import withDroppable from "../../DroppableComponent";
import { DynamicElement } from "./DynamicElement";
import { add } from 'src/redux/slice/canvasSlice';

interface EventDefinition {
  args: string[],
  calls: {contextId: string, body: string}[]
}

type ConvertedHandlers = Record<string, (...args: any[]) => any>;

export const DynamicComponent: React.FC<PropsWithChildren<{id: string, config: ComponentConfig, childrenIds: string[], draggable: boolean, droppable: boolean, mode?: 'preview' | 'editing'} & React.HTMLAttributes<HTMLElement>>> = ({id, config, childrenIds, draggable, droppable, children, mode, ...props}) => {
  const displayMode = mode || 'preview';
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(config.attributes.textContent || '');

  useEffect(() => {
    if (displayMode !== 'editing') {
      return;
    }
    const handleClickOutside = (ev: MouseEvent) => {
      const isClickInsideTextInput = ev.target instanceof HTMLInputElement && ev.target.classList.contains('editable-text-input');
      if (!isClickInsideTextInput) {
        setIsEditing(false);
        document.removeEventListener('mousedown', handleClickOutside);
      }
    }
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, displayMode]);

  useEffect(() => {
    if (displayMode === 'editing' && !isEditing && config.attributes.textContent !== editContent) {
      dispatch(add({ id, config: { ...config, attributes: { ...config.attributes, textContent: editContent } } }));
    }
  }, [displayMode, isEditing, editContent, config, id, dispatch])

  const toggleEdit: React.MouseEventHandler<HTMLElement> = (event) => {
    setIsEditing(true);
    event.stopPropagation();
  }

  const onClick = (isEditing || displayMode === 'preview') ? undefined : toggleEdit;

  const eventContextIds = [...new Set(config.events
    .map(e => e.actions.map(a => a.contextId))
    .flat())]; // Flatten and then remove duplicates using Set

  // const effectContextIds = [...new Set(config.effects
    // .map(e => e.actions.map(a => a.contextId))
    // .flat())]; // Flatten and then remove duplicates using Set

  // const contextIds = [...new Set(eventContextIds.concat(effectContextIds))];

  const attributeContextIds = Object.values(config.attributes)
    .filter((a): a is ProviderDependencyConfig => typeof a !== 'string')
    .map(a => a.contextId);

    const contextIds = [...new Set(eventContextIds.concat(attributeContextIds))];
  
  // Setup useEffects
  // config.effects.forEach(effectConfig => useDynamicEffect(effectConfig));

  const Component = useComponent(config.type);
  if (!Component) {
    return null;
  }

  return (
    <DynamicContextConsumer
      contextIds={contextIds}
      render={(contexts) => {

        // attributes can be either a string or a ProviderDependencyConfig.
        // If they are a ProviderDependencyConfig, we can use the context to get the value.
        
        const attributes = Object.keys(config.attributes).reduce((acc, key) => {
          const value = config.attributes[key];
          if (typeof value === 'string') {
            acc[key] = value;
          } else {
            acc[key] = convertProviderDependencyConfigToString(contexts, value);
          }
          return acc;
        }, {} as Record<string, string>);

        let convertedHandlers: Record<string, React.MouseEventHandler<HTMLElement>> = {};
        config.events.forEach((configEvent) => {
          convertedHandlers[configEvent.name] = ((contexts: Record<string, { dispatch: Function }>) => {
            return (event: React.MouseEvent) => {
              console.log('event', event);
              configEvent.actions.forEach((action) => {
                if (contexts[action.contextId] && typeof contexts[action.contextId].dispatch === 'function') {
                  contexts[action.contextId].dispatch({ type: action.actionName, payload: action.actionPayload ? JSON.parse(action.actionPayload) : null });
                } else {
                  console.error(`Context with id ${action.contextId} not found or dispatch not a function`);
                }
              });
            };
          })(contexts);
        });
        // const convertedHandlers: ConvertedHandlers = Object.keys(eventHandlers).reduce<ConvertedHandlers>((acc, key) => {
        //   const handler = eventHandlers[key];
        //   console.log('handler', handler);
        //   const bodies: string[] = [];
        //   for (const call of handler.calls) {
        //     bodies.push(`contexts['${call.contextId}']['dispatch'](` + call.body + ');');
        //   }
        //   const args = [...handler.args, 'contexts'];
        //   console.log(contexts);
        //   console.log(args);
        //   console.log(bodies);
        //   // eslint-disable-next-line no-new-func
        //   acc[key] = ((contexts) => {
        //     return (event) => {
        //       for (const call of handler.calls) {
        //         if (contexts[call.contextId] && typeof contexts[call.contextId]['dispatch'] === 'function') {
        //           contexts[call.contextId]['dispatch']({ type: call.body.type, payload: call.body.payload });
        //         } else {
        //           console.error(`Context with id ${call.contextId} not found or dispatch not a function`);
        //         }
        //       }
        //     };
        //   })(contexts);
        //   return acc;
        // }, {})

        if (onClick) {
          convertedHandlers['onClick'] = onClick;
        } 

        const Comp = withDragAndDrop(draggable, droppable, Component);
        return (
          <Comp id={id} onClick={onClick} {...convertedHandlers} {...config.attributes} {...props}>
            <Filler
              hasChildren={childrenIds.length > 0}
              childrenIds={childrenIds}
              isEditing={isEditing}
              editContent={typeof editContent === 'string' ? editContent : convertProviderDependencyConfigToString(contexts, editContent)}
              content={attributes.textContent || ''}
              setEditContent={setEditContent}
              setIsEditing={setIsEditing}
              draggable={draggable}
              droppable={droppable}
              displayMode={displayMode}
            />
          </Comp>
        );
      }}
    />
  );
}

const convertProviderDependencyConfigToString = (contexts: any, config: ProviderDependencyConfig) => {
  const contextValue = contexts[config.contextId]['state'];
  let attValue = contextValue;
  for (const sel of config.selector) {
    attValue = attValue[sel];
  }
  if (config.modifier) {
    // eslint-disable-next-line no-new-func
    attValue = Function(...config.modifier.args, config.modifier.body)(attValue);
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