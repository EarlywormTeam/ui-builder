import { all } from 'redux-saga/effects';
import { watchDoMagicWiring } from './doMagicWiring';
import { watchDoMagicPaint } from './doMagicPaint';
import { watchGenStarterTemplate } from './genStarterTemplate';

export default function* rootSaga() {
  yield all([
    watchDoMagicWiring(),
    watchDoMagicPaint(),
    watchGenStarterTemplate(),
  ]);
}
