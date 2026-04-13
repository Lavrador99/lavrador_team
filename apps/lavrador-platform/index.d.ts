/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'next-pwa';

declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}
