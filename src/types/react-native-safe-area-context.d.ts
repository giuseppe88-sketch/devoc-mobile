import 'react-native-safe-area-context';
import React from 'react';

declare module 'react-native-safe-area-context' {
  export interface SafeAreaProviderProps {
    children?: React.ReactNode;
    initialMetrics?: any;
    initialSafeAreaInsets?: any;
    style?: any;
  }

  export const SafeAreaProvider: React.FC<SafeAreaProviderProps>;
}
