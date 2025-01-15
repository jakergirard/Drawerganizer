declare module 'react-textfit' {
  import { CSSProperties, ReactNode } from 'react';

  interface TextfitProps {
    mode?: 'single' | 'multi';
    forceSingleModeWidth?: boolean;
    min?: number;
    max?: number;
    children?: ReactNode;
    style?: CSSProperties;
    className?: string;
    throttle?: number;
    autoResize?: boolean;
    onReady?: () => void;
  }

  export const Textfit: React.FC<TextfitProps>;
} 