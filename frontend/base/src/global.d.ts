import * as ReactTypes from 'react';

declare global {
  interface Window {
    React: typeof ReactTypes;
  }
}

export {};

