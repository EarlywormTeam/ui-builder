import { call, put, select, takeLatest } from 'redux-saga/effects';
import { genStarterTemplate, setNewConfigTree } from '../slice/canvasSlice';
import { getCanvasState } from '../selector';
import * as api from 'src/api';

function* handleGenStarterTemplate() {
  try {
    const { projectDescription } = yield select(getCanvasState);
    
    
    const { data: { configTree } } = yield call(api.genStarterTemplate, projectDescription);
    // update the canvas state with the new config tree
    yield put(setNewConfigTree({configTree}));
  } catch (error) {
    console.error('Error doing magic wiring', error);
  }
}

export function* watchGenStarterTemplate() {
  yield takeLatest(genStarterTemplate, handleGenStarterTemplate);
}
