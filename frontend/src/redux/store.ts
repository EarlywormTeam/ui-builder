import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './saga/index';
import canvasReducer, { CanvasState } from './slice/canvasSlice';
import loadingReducer, { LoadingState } from './slice/loadingSlice';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    loading: loadingReducer,
 },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({thunk: false}).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;

export interface RootState {
  canvas: CanvasState;
  loading: LoadingState;
}