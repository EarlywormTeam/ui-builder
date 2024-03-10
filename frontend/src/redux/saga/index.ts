import { all } from 'redux-saga/effects';
import { watchStartMagicWiring } from './startMagicWiring';
import { watchStartMagicPaint } from './startMagicPaint';
import { watchGenStarterTemplate } from './genStarterTemplate';

export default function* rootSaga() {
  yield all([
    watchStartMagicWiring(),
    watchStartMagicPaint(),
    watchGenStarterTemplate(),
  ]);
}
