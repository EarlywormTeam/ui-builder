import { useReducer, PropsWithChildren, createContext, useContext } from 'react';
import { ProviderConfig } from './config';
import { useDynamicContexts } from 'src/redux/selector';

export function DynamicProvider({id, config, children}: PropsWithChildren<{id: string, config: ProviderConfig}>) {
  const [state, dispatch] = useReducer(createReducer(config.actions), config.initialState);
  const Context = useDynamicContexts([id])[0];
  return <Context.Provider value={{state, dispatch}}>{children}</Context.Provider>
}

// Dynamically create reducer from JSON
const createReducer = (actions: Array<{name: string, payload: string, reducerCode: string}>) => {
  return (state: any, action: any) => {
    const matchedAction = actions.find(a => a.name === action.type);
    if (!matchedAction) return state;
    
    // Evaluate the reducerCode, providing state and action as available variables
    // eslint-disable-next-line no-new-func
    const f = new Function('state', 'action', matchedAction.reducerCode);
    return f(state, action);
  };
};
