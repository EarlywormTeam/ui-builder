import { createContext } from 'react';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ComponentConfig, ProviderConfig } from '../../pages/app/components/ir/good/config';
import { Context } from 'react';

export const contextMap: Record<string, Context<any>> = {};

interface CanvasComponentState {
  configMap: Record<string, ComponentConfig | ProviderConfig>;
  childrenMap: Record<string, string[]>;
  parentMap: Record<string, string>;
}

interface UndoRedoState {
  past: Array<CanvasComponentState>,
  present: CanvasComponentState,
  future: Array<CanvasComponentState>
}

export interface CanvasState {
  projectDescription: string | null;
  componentState: UndoRedoState;
  selectedIds: Array<string>;
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
    attributes:  { className: 'inline', textcontent: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'},
    events: [],
  },
  button: {
    type: 'button',
    attributes:  {className: 'flex w-full', textcontent: 'Button'},
    events: [],
  },
  switch: {
    type: 'switch',
    attributes: { className: 'inline-flex items-center' },
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
    attributes: {className: 'flex w-full', textcontent: 'Row Layout'},
    events: [],
  },
  colLayout__demo: {
    type: 'div',
    attributes:  { className: 'flex w-full', textcontent: 'Column Layout'},
    events: [],
  },
  label__demo: {
    type: 'label',
    attributes:  { className: 'inline', textcontent: 'Label'},
    events: [],
  },
  button__demo: {
    type: 'button',
    attributes:  {className: 'flex w-full', textcontent: 'Button'},
    events: [],
  },
  switch__demo: {
    type: 'switch',
    attributes: {className: 'inline-flex items-center'},
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
  componentState: {
    past: [],
    present: {
      configMap: defaultConfigMap,
      childrenMap: {} as Record<string, string[]>,
      parentMap: {} as Record<string, string>,
    },
    future: [],
  },
  selectedIds: [] as Array<string>,
};

const _removeId = (id: string, state: CanvasState) => {
  const componentState = state.componentState.present;
  const parentId = componentState.parentMap[id];
  if (parentId) {
    componentState.childrenMap[parentId] = componentState.childrenMap[parentId].filter(childId => childId !== id);
    delete componentState.parentMap[id];
  } 
}

const _deleteId = (id: string, state: CanvasState) => {
  const componentState = state.componentState.present;
  if (componentState.childrenMap[id]) {
    componentState.childrenMap[id].forEach(childId => _deleteId(childId, state));
  }
  _removeId(id, state);
  delete componentState.configMap[id];
  delete contextMap[id];
  state.selectedIds = state.selectedIds.filter((sid: string) => sid !== id);
}

const _insertId = (id: string, parentId: string, index: number | null, state: CanvasState) => {
  const componentState = state.componentState.present;
  if (!componentState.childrenMap[parentId]) {
    componentState.childrenMap[parentId] = [];
  }
  const children = componentState.childrenMap[parentId];
  const insertAt = index !== null ? index : children.length;
  componentState.childrenMap[parentId] = [...children.slice(0, insertAt), id, ...children.slice(insertAt)];
  componentState.parentMap[id] = parentId;

  if ('actions' in componentState.configMap[id] && 'initialState' in componentState.configMap[id]) {
    // It's a provider config, we need to hydrate the context and store it in the contextMap
    const config = componentState.configMap[id] as ProviderConfig;
    const context = createContext({state: config.initialState, dispatch: () => {}})
    contextMap[id] = context;
  }
}

const _addId = (id: string, config: ComponentConfig | ProviderConfig, state: CanvasState) => {
  state.componentState.present.configMap[id] = config;
}

const _updateTree = (node: any, state: CanvasState, parentId: string = 'canvas', depth=0) => {
  if (node.id !== 'canvas') {
    console.log('updateTree', node.id, node.config?.type || node.config?.name, depth, Array.isArray(node.children) ? node.children.length : 0);
    
    const existingConfig = state.componentState.present.configMap[node.id];

    const existingParentId = state.componentState.present.parentMap[node.id];
    if (parentId !== existingParentId) {
      if (existingParentId) {
        _removeId(node.id, state);
      }
    }

    const needsUpdate = !existingConfig || JSON.stringify(existingConfig) !== JSON.stringify(node.config);
    if (needsUpdate) {
      state.componentState.present.configMap[node.id] = node.config;
    }

    if (parentId !== existingParentId) {
      _insertId(node.id, parentId, null, state);
    }
  }
  
  const oldChildrenIds = state.componentState.present.childrenMap[node.id] || [];
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
    _updateTree(child, state, node.id, depth + 1);
  }
}

const updatePresentState = (state: CanvasState, stateChanger: () => void) => {
  state.componentState.past.push(JSON.parse(JSON.stringify(state.componentState.present)));
  stateChanger();
}

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<{ id: string; config: ComponentConfig | ProviderConfig }>) => {
      const { id, config } = action.payload;
      _addId(id, config, state);
    },
    insertChild: (state, action: PayloadAction<{ id: string; parentId: string; index: number | null }>) => {
      const { id, parentId, index } = action.payload;
      updatePresentState(state, () => _insertId(id, parentId, index, state));
    },
    deleteId: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      updatePresentState(state, () => _deleteId(id, state));
    },
    deleteSelected: (state) => {
      updatePresentState(state, () => {
        state.selectedIds.forEach(id => {
          _deleteId(id, state);
        });
      });
    },
    removeId: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      updatePresentState(state, () => _removeId(id, state));
    },
    setNewConfigTree: (state, action: PayloadAction<{ configTree: any }>) => {
      const {configTree} = action.payload;
      updatePresentState(state, () => _updateTree(configTree, state));
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
    },
    undo: (state) => {
      const savedState = state.componentState.past.pop();
      if (savedState) {
        state.componentState.future.push(state.componentState.present);
        state.componentState.present = savedState;
      }
    },
    redo: (state) => {
      const futureState = state.componentState.future.pop();
      if (futureState) {
        state.componentState.past.push(state.componentState.present);
        state.componentState.present = futureState;
      }
    }
  },
});

export const { add, insertChild, removeId, setNewConfigTree, genStarterTemplate, setSelectedIds, deleteSelected, deleteId, addSelectedId, removeSelectedId, undo, redo } = canvasSlice.actions;

export default canvasSlice.reducer;