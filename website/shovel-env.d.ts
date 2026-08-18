// Globals shovel injects into the ServiceWorker build. Neither is part of the
// standard lib, so without these declarations the static-site generation in
// app.tsx does not typecheck.

interface ImportMetaEnv {
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ServiceWorkerGlobalScope {
  /** Named output buckets, written during the install lifecycle. */
  readonly directories: {
    open(name: string): Promise<FileSystemDirectoryHandle>;
  };
}
