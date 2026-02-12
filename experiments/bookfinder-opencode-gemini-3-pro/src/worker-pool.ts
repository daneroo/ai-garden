export interface WorkerPoolCallbacks<T> {
  onProgress?: (completed: number, total: number) => void;
  onItemStart?: (item: T) => void;
  onItemFinish?: (item: T) => void;
}

export async function runWorkerPool<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<R>,
  callbacks?:
    | WorkerPoolCallbacks<T>
    | ((completed: number, total: number, item: T) => void),
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  // normalize callbacks
  let onProgress:
    | ((completed: number, total: number, item: T) => void)
    | undefined;
  let onItemStart: ((item: T) => void) | undefined;
  let onItemFinish: ((item: T) => void) | undefined;

  if (typeof callbacks === "function") {
    onProgress = callbacks;
  } else if (callbacks) {
    onProgress = (c, t) => callbacks.onProgress?.(c, t);
    onItemStart = callbacks.onItemStart;
    onItemFinish = callbacks.onItemFinish;
  }

  const worker = async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) {
        break;
      }

      const item = items[index];
      if (onItemStart) onItemStart(item);

      const result = await task(item);
      results[index] = result;

      completed++;
      if (onItemFinish) onItemFinish(item);
      if (onProgress) {
        onProgress(completed, items.length, item);
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return results;
}
