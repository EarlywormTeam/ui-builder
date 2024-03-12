import { useReducer, PropsWithChildren } from 'react';
import { ProviderConfig } from './config';
import { useDynamicContexts } from 'src/redux/selector';

export function DynamicProvider({id, config, listIndex, children}: PropsWithChildren<{id: string, config: ProviderConfig, listIndex: string | undefined}>) {
  const [state, dispatch] = useReducer(createReducer(config.actions), config.initialState);
  const Context = useDynamicContexts([id])[0];
  return <Context.Provider value={{state, dispatch}}>{children}</Context.Provider>
}

// Dynamically create reducer from JSON
const createReducer = (actions: Array<{name: string, reducerCode: string}>) => {
  return (state: any, action: any) => {
    console.log('state', state);
    console.log('action', action);
    const matchedAction = actions.find(a => a.name === action.type);
    if (!matchedAction) return state;
    
    // Evaluate the reducerCode, providing state and action as available variables
    // eslint-disable-next-line no-new-func
    const f = new Function('state', 'action', matchedAction.reducerCode);
    return f(state, action);
  };
};
