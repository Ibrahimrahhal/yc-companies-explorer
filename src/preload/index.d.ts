import type { YCApi } from './index'

declare global {
  interface Window {
    yc: YCApi
  }
}

export {}
