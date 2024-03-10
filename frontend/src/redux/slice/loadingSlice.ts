import { createSlice } from '@reduxjs/toolkit';
import { Context } from 'react';

export const contextMap: Record<string, Context<any>> = {};

export interface LoadingState {
  magicWiringLoading: boolean;
  magicPaintingLoading: boolean;
}

const initialState: LoadingState = {
  magicWiringLoading: false,
  magicPaintingLoading: false
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
    }
  },
});

export const { startMagicWiring, startMagicPaint, stopMagicWiring, stopMagicPaint } = loadingSlice.actions;

export default loadingSlice.reducer;