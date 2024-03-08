import { call, put, select, takeLatest } from 'redux-saga/effects';
import { doMagicWiring, setNewConfigTree } from '../slice/canvasSlice';
import { getCanvasState } from '../selector';
import * as api from 'src/api';

function* handleDoMagicWiring() {
  try {
    const { configMap, childrenMap } = yield select(getCanvasState);
    const buildTree = (id: string) => {
      const config = configMap[id];
      const childrenIds = childrenMap[id] || [];
      const children = childrenIds.map(buildTree);
      return { id, config, children };
    };

    const postConfigTree = buildTree('canvas');
    
    const { data: { configTree } } = yield call(api.doMagicWiring, postConfigTree);
    // update the canvas state with the new config tree
    yield put(setNewConfigTree({configTree}));
  } catch (error) {
    console.error('Error doing magic wiring', error);
  }
}

export function* watchDoMagicWiring() {
  yield takeLatest(doMagicWiring, handleDoMagicWiring);
}

