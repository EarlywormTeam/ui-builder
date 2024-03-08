import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { contextMap } from '../slice/canvasSlice';

export const getCanvasState = (state: RootState) => state.canvas;

export const useDynamicContexts = (ids: string[]) => {
  const Contexts = ids.map(id => contextMap[id]).filter(c => c !== undefined);
  if (Contexts.length !== ids.length) {
    throw new Error('Contexts length does not match ids length');
  }
  return Contexts;
}

export const useChildrenIds = (id: string) => {
  const childrenIds = useSelector((state: RootState) => state.canvas.childrenMap[id]);
  return childrenIds || [];
}

