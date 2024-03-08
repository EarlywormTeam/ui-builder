import React from 'react';
import { useDynamicContexts } from 'src/redux/selector';

interface DynamicContextConsumerProps {
  contextIds: string[];
  render: (values: { [contextId: string]: any }) => JSX.Element;
}

export const DynamicContextConsumer: React.FC<DynamicContextConsumerProps> = ({ contextIds, render }) => {
  const Contexts = useDynamicContexts(contextIds);

  if (contextIds.length === 0) {
    return render({});
  }

  console.log('Building dynamic context consumer for contextIds', contextIds, Contexts);

  // Recursive function to nest context consumers
  const nestContextConsumers = (index: number, collectedValues: { [contextId: string]: any } = {}): JSX.Element | null => {
    if (index >= Contexts.length) {
      return render(collectedValues); // When no more contexts, call render with collected values
    }

    const Context = Contexts[index];
    return (
      <Context.Consumer>
        {(value: any) => {
          console.log('value', value);
          return nestContextConsumers(index + 1, { ...collectedValues, [contextIds[index]]: value });
        }}
      </Context.Consumer>
    );
  };

  return nestContextConsumers(0);
};

// Usage example, assuming contexts is an array of React context objects
/* <DynamicContextConsumer
  contexts={[ContextA, ContextB, ContextC]}
  render={(values) => {
    // values[0] is the value from ContextA, values[1] from ContextB, etc.
    return <div>{/* Render your component using context values here </div>;
  }}
/> */
