import { createContext } from 'react';
import { PayloadAction, createSlice, current } from '@reduxjs/toolkit';
import { ComponentConfig, ProviderConfig } from '../../pages/app/components/ir/good/config';
import { Context } from 'react';

export const contextMap: Record<string, Context<any>> = {};

export interface CanvasState {
  configMap: Record<string, ComponentConfig | ProviderConfig>;
  childrenMap: Record<string, string[]>;
  parentMap: Record<string, string>;
  magicWiringLoading: boolean;
}

const defaultConfigMap: Record<string, ComponentConfig | ProviderConfig> = {
  rowLayout: {
    type: 'row',
    attributes: { className: 'flex w-full flex-grow bg-blue-100' },
    events: [],
  },
  colLayout: {
    type: 'col',
    attributes: { className: 'flex flex-col w-full h-full flex-grow bg-green-100' },
    events: [],
  },
  label: {
    type: 'label',
    attributes:  { className: 'inline', textContent: 'Label'},
    events: [],
  },
  button: {
    type: 'button',
    attributes:  {className: 'flex w-full', textContent: 'Button'},
    events: [],
  },
  rowLayout__demo: {
    type: 'row',
    attributes: {className: 'flex w-full', textContent: 'Row Layout'},
    events: [],
  },
  colLayout__demo: {
    type: 'col',
    attributes:  { className: 'flex w-full', textContent: 'Column Layout'},
    events: [],
  },
}

const initialState: CanvasState = {
  configMap: defaultConfigMap,
  childrenMap: {} as Record<string, string[]>,
  parentMap: {} as Record<string, string>,
  magicWiringLoading: false,
};

const removeId = (id: string, state: CanvasState) => {
  if (state.childrenMap[id]) {
    state.childrenMap[id].forEach(childId => removeId(childId, state));
  }
  const parentId = state.parentMap[id];
  if (parentId) {
    state.childrenMap[parentId] = state.childrenMap[parentId].filter(childId => childId !== id);
    delete state.parentMap[id];
  }
  delete state.configMap[id];
  delete contextMap[id];
}

const insertId = (id: string, parentId: string, index: number | null, state: CanvasState) => {
  if (!state.childrenMap[parentId]) {
    state.childrenMap[parentId] = [];
  }
  const children = state.childrenMap[parentId];
  const insertAt = index !== null ? index : children.length;
  state.childrenMap[parentId] = [...children.slice(0, insertAt), id, ...children.slice(insertAt)];
  state.parentMap[id] = parentId;

  if ('actions' in state.configMap[id] && 'initialState' in state.configMap[id]) {
    // It's a provider config, we need to hydrate the context and store it in the contextMap
    const config = state.configMap[id] as ProviderConfig;
    const context = createContext({state: config.initialState, dispatch: () => {}})
    contextMap[id] = context;
  }
}

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<{ id: string; config: ComponentConfig | ProviderConfig }>) => {
      const { id, config } = action.payload;
      state.configMap[id] = config;
    },
    insertChild: (state, action: PayloadAction<{ id: string; parentId: string; index: number | null }>) => {
      const { id, parentId, index } = action.payload;
      insertId(id, parentId, index, state);
    },
    remove: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      removeId(id, state);
    },
    doMagicWiring: (state) => {
      state.magicWiringLoading = true;
    },
    setNewConfigTree: (state, action: PayloadAction<{ configTree: any }>) => {
      const {configTree} = action.payload;
      let stateCopy = JSON.parse(JSON.stringify(current(state)));
      const updateTree = (node: any, parentId: string = 'canvas', depth=0) => {
        if (node.id !== 'canvas') {
          console.log('updateTree', node.id, node.config?.type || node.config?.name, depth, Array.isArray(node.children) ? node.children.length : 0);
          
          const existingConfig = stateCopy.configMap[node.id];

          let removed = false;
          const existingParentId = stateCopy.parentMap[node.id];
          if (parentId !== existingParentId) {
            if (existingParentId) {
              removeId(node.id, stateCopy);
              removed = true;
            }
          }

          const needsUpdate = !existingConfig || JSON.stringify(existingConfig) !== JSON.stringify(node.config);
          if (removed || needsUpdate) {
            stateCopy.configMap[node.id] = node.config;
          }

          if (parentId !== existingParentId) {
            insertId(node.id, parentId, null, stateCopy);
          }
        }
        
        const oldChildrenIds = stateCopy.childrenMap[node.id] || [];
        const newChildrenIds = node.children.map((child: any) => child.id);

        for (const oldChildId of oldChildrenIds) {
          if (!newChildrenIds.includes(oldChildId)) {
            removeId(oldChildId, stateCopy);
          }
        }

        for (const child of node.children) {
          updateTree(child, node.id, depth + 1);
        }
      }
      updateTree(configTree);
      stateCopy.magicWiringLoading = false;
      return {...stateCopy};
    }
  },
});

export const { add, insertChild, remove, doMagicWiring, setNewConfigTree } = canvasSlice.actions;

export default canvasSlice.reducer;