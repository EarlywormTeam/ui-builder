import { all } from 'redux-saga/effects';
import { watchDoMagicWiring } from './doMagicWiring';

export default function* rootSaga() {
  yield all([
    watchDoMagicWiring(),
  ]);
}
