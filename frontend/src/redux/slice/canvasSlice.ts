import { createContext } from 'react';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ComponentConfig, ProviderConfig, ListConfig } from '../../pages/app/components/ir/good/config';
import { Context } from 'react';

export const contextMap: Record<string, Context<any>> = {};

interface CanvasComponentState {
  configMap: Record<string, ComponentConfig | ProviderConfig | ListConfig>;
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
  demoConfigMap: Record<string, ComponentConfig | ListConfig>
  componentState: UndoRedoState;
  selectedIds: Record<string, boolean>;
  textEditingId: string | null;
  lastClickTime: Record<string, number>;
}

const demoConfigMap: Record<string, ComponentConfig> = {
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

const defaultConfigMap: Record<string, ComponentConfig | ProviderConfig | ListConfig> = {}

const initialState: CanvasState = {
  projectDescription: null,
  demoConfigMap: demoConfigMap,
  componentState: {
    past: [],
    present: {
      configMap: defaultConfigMap,
      childrenMap: {} as Record<string, string[]>,
      parentMap: {} as Record<string, string>,
    },
    future: [],
  },
  selectedIds: {},
  textEditingId: null,
  lastClickTime: {},  
};

const _removeId = (id: string, state: CanvasState) => {
  const componentState = state.componentState.present;
  const parentId = componentState.parentMap[id];
  // Remove this node from the parent's childrenMap
  if (parentId) {
    componentState.childrenMap[parentId] = componentState.childrenMap[parentId].filter(childId => childId !== id);
  } 
  const children = componentState.childrenMap[id];
  if (children) {
    children.forEach(childId => _removeId(childId, state));
  }
  // Delete the parentMap & childrenMap entries
  delete componentState.childrenMap[id];
  delete componentState.parentMap[id];
  delete state.selectedIds[id];
  delete state.lastClickTime[id];
}

const _deleteId = (id: string, state: CanvasState) => {
  const componentState = state.componentState.present;
  if (componentState.childrenMap[id]) {
    componentState.childrenMap[id].forEach(childId => _deleteId(childId, state));
  }
  _removeId(id, state);
  delete componentState.configMap[id];
  delete contextMap[id];
  delete state.selectedIds[id];
  delete state.lastClickTime[id];
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
  state.selectedIds[id] = false;
  state.lastClickTime[id] = 0;
}

const _addId = (id: string, config: ComponentConfig | ProviderConfig | ListConfig, state: CanvasState) => {
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
    add: (state, action: PayloadAction<{ id: string; config: ComponentConfig | ProviderConfig | ListConfig }>) => {
      const { id, config } = action.payload;
      _addId(id, config, state);
    },
    addConfigClassName: (state, action: PayloadAction<{ id: string; className: string }>) => {
      const { id, className } = action.payload;
      updatePresentState(state, () => {
        const config = state.componentState.present.configMap[id];
        if (config && 'attributes' in config) {
          if (typeof config.attributes.className === 'string') {
            config.attributes.className = className + ' ' + config.attributes.className;
          } else {
            console.error('className is bound, updating is not supported yet.');
          }
        }
      });
    },
    removeConfigClassName: (state, action: PayloadAction<{ id: string, className: string }>) => {
      const { id, className } = action.payload;
      updatePresentState(state, () => {
        const config = state.componentState.present.configMap[id];
        if (config && 'attributes' in config) {
          if (typeof config.attributes.className === 'string') {
            config.attributes.className = config.attributes.className.replace(className, '');
          } else {
            console.error('className is bound, updating is not supported yet.');
          }
        }
      })
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
        Object.entries(state.selectedIds).forEach(([key, value]) => {
          if (value === true) {
            _deleteId(key, state);
           }
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
    setSelectedStateForIds: (state, action: PayloadAction<Record<string, boolean>>) => {
      Object.entries(action.payload).forEach(([id, isSelected]) => {
        state.selectedIds[id] = isSelected;
      });
    },
    setSelectedIds: (state, action: PayloadAction<Array<string>>) => {
      Object.keys(state.selectedIds).forEach(id => state.selectedIds[id] = action.payload.includes(id));
    },
    addSelectedId: (state, action: PayloadAction<string>) => {
      state.selectedIds[action.payload] = true;
    },
    removeSelectedId: (state, action: PayloadAction<string>) => {
      state.selectedIds[action.payload] = false;
    },
    setLastClickTime: (state, action: PayloadAction<{ id: string, time: number }>) => {
      const { id, time } = action.payload;
      state.lastClickTime[id] = time;
    },
    setTextEditingId: (state, action: PayloadAction<string | null>) => {
      state.textEditingId = action.payload;
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

export const { add, addConfigClassName, removeConfigClassName, insertChild, removeId, setNewConfigTree, genStarterTemplate, setSelectedIds, deleteSelected, deleteId, addSelectedId, removeSelectedId, setLastClickTime, setTextEditingId, undo, redo } = canvasSlice.actions;

export default canvasSlice.reducer;