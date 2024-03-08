// import { useEffect, useRef } from 'react';
// import { EffectConfig } from './config';

// export function useDynamicEffects(effectConfigs: Array<EffectConfig>) {
//   const prevDepsRef = useRef([]);

//   effectConfigs.forEach((config, index) => {
//     const hasChanged = prevDepsRef.current[index]?.some((dep, i) => !Object.is(dep, config.deps[i]));
//     const isFirstRender = prevDepsRef.current.length === 0;

//     if (isFirstRender || hasChanged) {
      
//     }

//     prevDepsRef.current[index] = config.deps;
//   });
// }

export {}