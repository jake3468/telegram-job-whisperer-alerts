/// <reference types="vite/client" />

declare global {
  interface Window {
    jobBoardNavigationCallback?: (tabName: string) => void;
  }
}
