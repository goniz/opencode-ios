declare module 'react-native-syntax-highlighter' {
  import { ComponentType } from 'react';
  import { ViewStyle } from 'react-native';

  interface SyntaxHighlighterProps {
    children: string;
    style?: object;
    language?: string;
    customStyle?: ViewStyle;
    lineNumbers?: boolean;
  }

  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  
  export default SyntaxHighlighter;
}

declare module 'react-native-syntax-highlighter/dist/esm/styles' {
  export const atomOneDark: object;
  export const atomOneLight: object;
  export const github: object;
  export const googlecode: object;
  export const gradientDark: object;
  export const gradientLight: object;
  export const monokai: object;
  export const monokaiSublime: object;
  export const vs: object;
  export const vs2015: object;
  export const xcode: object;
}