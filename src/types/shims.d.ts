declare module "aedes-stats" {
  const stats: (broker: unknown) => void;
  export = stats;
}

declare module "websocket-stream" {
  import type { Server as HttpServer } from "http";
  import type { Duplex } from "stream";

  interface CreateServerOptions {
    server: HttpServer;
  }

  function createServer(options: CreateServerOptions, handle: (stream: Duplex) => void): unknown;

  const ws: {
    createServer: typeof createServer;
  };

  export = ws;
}

declare module "react-dropzone" {
  import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

  export interface FileRejection {
    file: File;
    errors: Array<{ code: string; message: string }>;
  }

  export interface DropzoneState {
    getRootProps: (props?: HTMLAttributes<HTMLElement>) => HTMLAttributes<HTMLElement>;
    getInputProps: (props?: HTMLAttributes<HTMLInputElement>) => HTMLAttributes<HTMLInputElement>;
    isDragActive: boolean;
  }

  export interface DropzoneOptions {
    onDrop?: (acceptedFiles: File[], fileRejections: FileRejection[]) => void;
    accept?: string | string[];
    multiple?: boolean;
  }

  export function useDropzone(options?: DropzoneOptions): DropzoneState;

  const Dropzone: (
    props: DropzoneOptions & {
      children?: (state: DropzoneState) => ReactNode;
      style?: CSSProperties;
    },
  ) => ReactNode;

  export default Dropzone;
}
