import { useContext } from 'react';
import { ConfigContext } from 'contexts/ConfigContext';
import type { ConfigContextType } from 'types/config';

// ==============================|| CONFIG - HOOKS ||============================== //

export default function useConfig(): ConfigContextType {
  return useContext(ConfigContext);
}