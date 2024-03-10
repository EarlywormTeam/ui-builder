import axios from 'axios';
import { ComponentConfig, ProviderConfig } from 'src/pages/app/components/ir/good/config';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}); 

export const doMagicWiring = (configTree: { id: string; config: ComponentConfig | ProviderConfig; children: any[] }) => {
  return apiClient.post('/api/visual-ide/magic-wiring', {configTree});
};

export const doMagicPaint = (configTree: { id: string; config: ComponentConfig | ProviderConfig; children: any[] }) => {
  return apiClient.post('/api/visual-ide/magic-paint', {configTree});
};

export const genStarterTemplate = (projectDescription: string) => {
  return apiClient.post('/api/visual-ide/starter-template', {projectDescription});
};

