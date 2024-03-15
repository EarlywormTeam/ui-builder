import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { contextMap } from '../slice/canvasSlice';

export const getProjectDescription = (state: RootState) => state.canvas.projectDescription;

export const getCanvasState = (state: RootState) => state.canvas.componentState.present;

export const useDynamicContexts = (ids: string[]) => {
  const Contexts = ids.map(id => contextMap[id]).filter(c => c !== undefined);
  if (Contexts.length !== ids.length) {
    throw new Error('Contexts length does not match ids length');
  }
  return Contexts;
}

export const useChildrenIds = (id: string) => {
  const childrenIds = useSelector((state: RootState) => state.canvas.componentState.present.childrenMap[id]);
  return childrenIds || [];
}

