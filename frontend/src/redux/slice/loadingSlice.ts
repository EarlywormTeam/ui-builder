import { createSlice } from '@reduxjs/toolkit';
import { Context } from 'react';

export const contextMap: Record<string, Context<any>> = {};

export interface LoadingState {
  magicWiringLoading: boolean;
  magicPaintingLoading: boolean;
  projectTemplateLoading: boolean;
}

const initialState: LoadingState = {
  magicWiringLoading: false,
  magicPaintingLoading: false,
  projectTemplateLoading: false,
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    startMagicWiring: (state) => {
      state.magicWiringLoading = true;
    },
    startMagicPaint: (state) => {
      state.magicPaintingLoading = true;
    },
    stopMagicWiring: (state) => {
      state.magicWiringLoading = false;
    },
    stopMagicPaint: (state) => {
      state.magicPaintingLoading = false;
    },
    startProjectTemplateLoading: (state) => {
      state.projectTemplateLoading = true;
    },
    stopProjectTemplateLoading: (state) => {
      state.projectTemplateLoading = false;
    },
  },
});

export const { startMagicWiring, startMagicPaint, stopMagicWiring, stopMagicPaint, startProjectTemplateLoading, stopProjectTemplateLoading } = loadingSlice.actions;

export default loadingSlice.reducer;