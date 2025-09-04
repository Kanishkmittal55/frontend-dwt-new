import PropTypes from 'prop-types';
import { createContext } from 'react';

// project imports
import defaultConfig from 'config';
import useLocalStorage from 'hooks/useLocalStorage';
import type { ConfigContextType, ThemeConfig } from 'types/config';

// initial state
const initialState: ConfigContextType = {
  ...defaultConfig,
  onChangeFontFamily: () => {},
  onChangeBorderRadius: () => {},
  onReset: () => {}
};

// ==============================|| CONFIG CONTEXT & PROVIDER ||============================== //

const ConfigContext = createContext<ConfigContextType>(initialState);

interface ConfigProviderProps {
  children: React.ReactNode;
}

function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useLocalStorage<Partial<ThemeConfig>>('berry-config-vite-ts', {
    fontFamily: initialState.fontFamily,
    borderRadius: initialState.borderRadius
  });

  const onChangeFontFamily = (fontFamily: string) => {
    setConfig({
      ...config,
      fontFamily
    });
  };

  const onChangeBorderRadius = (event: Event, newValue: number) => {
    setConfig({
      ...config,
      borderRadius: newValue
    });
  };

  const onReset = () => {
    setConfig({ 
      fontFamily: defaultConfig.fontFamily,
      borderRadius: defaultConfig.borderRadius
    });
  };

  return (
    <ConfigContext.Provider
      value={{
        ...defaultConfig,
        ...config,
        onChangeFontFamily,
        onChangeBorderRadius,
        onReset
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export { ConfigProvider, ConfigContext };