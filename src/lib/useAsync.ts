import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { friendlyError } from './errors';

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: string };

export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    run().then(
      (data) => active && setState({ status: 'success', data }),
      (err) => active && setState({ status: 'error', error: friendlyError(err) }),
    );
    return () => {
      active = false;
    };
  }, [run, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
