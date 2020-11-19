/**
 * whether in browser env
 */
export const isBrowser = () => typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined';
/**
 * get window.g_initialProps
 */
export const getWindowInitialProps = () => isBrowser() ? window.g_initialProps : undefined;
/**
 * whether SSR success in client
 */
export const isSSR = () => isBrowser() && window.g_useSSR;
