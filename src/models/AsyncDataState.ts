export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface IAsyncDataState<T> {
  status: AsyncStatus;
  data: T;
  error?: string;
}

export const idleState = <T>(initial: T): IAsyncDataState<T> => ({
  status: 'idle',
  data: initial
});

export const loadingState = <T>(previous: T): IAsyncDataState<T> => ({
  status: 'loading',
  data: previous
});

export const successState = <T>(data: T): IAsyncDataState<T> => ({
  status: 'success',
  data
});

export const errorState = <T>(previous: T, error: string): IAsyncDataState<T> => ({
  status: 'error',
  data: previous,
  error
});
