import { createContext } from 'react';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ComponentConfig, ProviderConfig } from '../../pages/app/components/ir/good/config';
import { Context } from 'react';

export const contextMap: Record<string, Context<any>> = {};

export interface CanvasState {
  projectDescription: string | null;
  configMap: Record<string, ComponentConfig | ProviderConfig>;
  childrenMap: Record<string, string[]>;
  parentMap: Record<string, string>;
  selectedIds: Array<string>;
  magicWiringLoading: boolean;
  magicPaintingLoading: boolean;
}

const defaultConfigMap: Record<string, ComponentConfig | ProviderConfig> = {
  rowLayout: {
    type: 'div',
    attributes: { className: 'flex w-full flex-grow bg-blue-100' },
    events: [],
  },
  colLayout: {
    type: 'div',
    attributes: { className: 'flex flex-col w-full h-full flex-grow bg-green-100' },
    events: [],
  },
  label: {
    type: 'label',
    attributes:  { className: 'inline', textContent: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'},
    events: [],
  },
  button: {
    type: 'button',
    attributes:  {className: 'flex w-full', textContent: 'Button'},
    events: [],
  },
  input: {
    type: 'input',
    attributes: { className: 'w-full h-8 bg-gray-100', defaultValue: 'Type here...'},
    events: [],
  },
  textArea: {
    type: 'textarea',
    attributes: { className: 'w-full h-24 bg-gray-100', defaultValue: 'Type here...'},
    events: [],
  },
  rowLayout__demo: {
    type: 'div',
    attributes: {className: 'flex w-full', textContent: 'Row Layout'},
    events: [],
  },
  colLayout__demo: {
    type: 'div',
    attributes:  { className: 'flex w-full', textContent: 'Column Layout'},
    events: [],
  },
  label__demo: {
    type: 'label',
    attributes:  { className: 'inline', textContent: 'Label'},
    events: [],
  },
  button__demo: {
    type: 'button',
    attributes:  {className: 'flex w-full', textContent: 'Button'},
    events: [],
  },
  input__demo: {
    type: 'input',
    attributes: { className: 'w-full h-8 bg-gray-100', defaultValue: 'Text Input'},
    events: [],
  },
  textArea__demo: {
    type: 'textarea',
    attributes: { className: 'w-full h-24 bg-gray-100', defaultValue: 'Text Area'},
    events: [],
  },
}

const initialState: CanvasState = {
  projectDescription: null,
  configMap: defaultConfigMap,
  childrenMap: {} as Record<string, string[]>,
  parentMap: {} as Record<string, string>,
  selectedIds: [] as Array<string>,
  magicWiringLoading: false,
  magicPaintingLoading: false
};

const _removeId = (id: string, state: CanvasState) => {
  const parentId = state.parentMap[id];
  if (parentId) {
    state.childrenMap[parentId] = state.childrenMap[parentId].filter(childId => childId !== id);
    delete state.parentMap[id];
  } 
}

const _deleteId = (id: string, state: CanvasState) => {
  if (state.childrenMap[id]) {
    state.childrenMap[id].forEach(childId => _deleteId(childId, state));
  }
  _removeId(id, state);
  delete state.configMap[id];
  delete contextMap[id];
  state.selectedIds = state.selectedIds.filter((sid: string) => sid !== id);
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
    deleteId: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      _deleteId(id, state);
    },
    deleteSelected: (state) => {
      state.selectedIds.forEach(id => {
        _deleteId(id, state);
      });
    },
    removeId: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      _removeId(id, state);
    },
    doMagicWiring: (state) => {
      state.magicWiringLoading = true;
    },
    doMagicPaint: (state) => {
      state.magicPaintingLoading = true;
    },
    setNewConfigTree: (state, action: PayloadAction<{ configTree: any }>) => {
      const {configTree} = action.payload;
      const updateTree = (node: any, parentId: string = 'canvas', depth=0) => {
        if (node.id !== 'canvas') {
          console.log('updateTree', node.id, node.config?.type || node.config?.name, depth, Array.isArray(node.children) ? node.children.length : 0);
          
          const existingConfig = state.configMap[node.id];

          const existingParentId = state.parentMap[node.id];
          if (parentId !== existingParentId) {
            if (existingParentId) {
              _removeId(node.id, state);
            }
          }

          const needsUpdate = !existingConfig || JSON.stringify(existingConfig) !== JSON.stringify(node.config);
          if (needsUpdate) {
            state.configMap[node.id] = node.config;
          }

          if (parentId !== existingParentId) {
            insertId(node.id, parentId, null, state);
          }
        }
        
        const oldChildrenIds = state.childrenMap[node.id] || [];
        if (!node.children) {
          node.children = [];
        }
        const newChildrenIds = node.children.map((child: any) => child.id);

        for (const oldChildId of oldChildrenIds) {
          if (!newChildrenIds.includes(oldChildId)) {
            _deleteId(oldChildId, state);
          }
        }

        for (const child of node.children) {
          updateTree(child, node.id, depth + 1);
        }
      }
      updateTree(configTree);
      state.magicWiringLoading = false;
      state.magicPaintingLoading = false;
    },
    genStarterTemplate: (state, action: PayloadAction<{ projectDescription: string }>) => {
      const { projectDescription } = action.payload;
      state.projectDescription = projectDescription;
    },
    setSelectedIds: (state, action: PayloadAction<Array<string>>) => {
      state.selectedIds = action.payload;
    },
    addSelectedId: (state, action: PayloadAction<string>) => {
      state.selectedIds.push(action.payload);
    },
    removeSelectedId: (state, action: PayloadAction<string>) => {
      state.selectedIds = state.selectedIds.filter(id => id !== action.payload);
    }
  },
});

export const { add, insertChild, removeId, doMagicWiring, doMagicPaint, setNewConfigTree, genStarterTemplate, setSelectedIds, deleteSelected, deleteId, addSelectedId, removeSelectedId } = canvasSlice.actions;

export default canvasSlice.reducer;