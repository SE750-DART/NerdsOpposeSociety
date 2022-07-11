import { Reducer, useCallback, useMemo, useReducer } from "react";
import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from "axios";

/**
 * Request actions
 */
enum ActionType {
  REQUEST_START = "request_start",
  REQUEST_SUCCESS = "request_success",
  REQUEST_ERROR = "request_error",
}

/**
 * Request reducer actions
 */
type Action<T, D> =
  | { type: ActionType.REQUEST_START }
  | { type: ActionType.REQUEST_SUCCESS }
  | { type: ActionType.REQUEST_ERROR; error: AxiosError<T, D> | Error };

/**
 * Request state
 */
type State<T, D> = {
  isLoading: boolean;
  error: AxiosError<T, D> | Error | undefined;
};

/**
 * Reducer function for request state
 * @param state
 * @param action
 */
const reducer = <T, D>(
  state: State<T, D>,
  action: Action<T, D>
): State<T, D> => {
  switch (action.type) {
    case ActionType.REQUEST_START: {
      return { isLoading: true, error: undefined };
    }
    case ActionType.REQUEST_SUCCESS: {
      return { isLoading: false, error: undefined };
    }
    case ActionType.REQUEST_ERROR: {
      return { isLoading: false, error: action.error };
    }
  }
};

/**
 * Invokes an Axios request.
 *
 * @param controller - AbortController used to cancel effects -
 * See [Axios docs](https://axios-http.com/docs/cancellation).
 * This is important when invoking a request within a `useEffect` to perform
 * [cleanup](https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1).
 */
type Request<T, D> = (
  controller?: AbortController
) => Promise<AxiosResponse<T, D> | null>;

/**
 * Returns a state object and a `request` function to initiate an HTTP request.
 *
 * The `state` object contains values for `isLoading` and `error`.
 *
 * The `request` function receives an optional `controller` parameter for stopping
 * a request in progress. See [Axios docs](https://axios-http.com/docs/cancellation) for more.
 *
 * @param config - Request config. See [Axios docs](https://axios-http.com/docs/req_config)
 * @returns [state, request] - Array consisting of a `state` object and a
 * `request` function to initiate an HTTP request.
 */
const useAxios = <T, D>(
  config: Omit<AxiosRequestConfig<D>, "signal">
): [State<T, D>, Request<T, D>] => {
  const [state, dispatch] = useReducer<Reducer<State<T, D>, Action<T, D>>>(
    reducer,
    {
      isLoading: false,
      error: undefined,
    }
  );

  const request = useCallback<Request<T, D>>(
    async (controller) => {
      dispatch({ type: ActionType.REQUEST_START });

      try {
        let requestConfig: AxiosRequestConfig<D> = config;
        if (controller) {
          requestConfig = { ...requestConfig, signal: controller.signal };
        }

        const response = await axios(requestConfig);
        dispatch({ type: ActionType.REQUEST_SUCCESS });
        return response;
      } catch (error) {
        if (axios.isCancel(error)) {
          /*
          This block is executed if `controller` has signalled axios to cancel
          the request. See [Axios docs](https://axios-http.com/docs/cancellation)
          for more detail. We return null & do not dispatch here to prevent any
          state changes as the purpose of this feature is to perform safe
          [`useEffect()` cleanup](https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1)
           */
          return null;
        } else if (axios.isAxiosError(error)) {
          dispatch({ type: ActionType.REQUEST_ERROR, error });
        } else {
          const error = Error("Server Error");
          dispatch({ type: ActionType.REQUEST_ERROR, error });
        }
        return null;
      }
    },
    [config]
  );

  return useMemo(() => [state, request], [state, request]);
};

/**
 * Returns a state object and a `request` function to initiate a GET request.
 *
 * The `state` object contains values for `isLoading` and `error`.
 *
 * The `request` function receives an optional `controller` parameter for stopping
 * a request in progress. See [Axios docs](https://axios-http.com/docs/cancellation) for more.
 *
 * @param url - Request URL
 * @param config - Request config. See [Axios docs](https://axios-http.com/docs/req_config)
 * @returns [state, request] - Array consisting of a `state` object and a
 * `request` function to initiate a GET request.
 */
export const useGet = <T, D = unknown>(
  url: string,
  config?: Omit<AxiosRequestConfig<D>, "method" | "url" | "signal">
) => {
  return useAxios<T, D>(
    useMemo(() => ({ ...config, method: "get", url }), [config, url])
  );
};

/**
 * Returns a state object and a `request` function to initiate a POST request.
 *
 * The `state` object contains values for `isLoading` and `error`.
 *
 * The `request` function receives an optional `controller` parameter for stopping
 * a request in progress. See [Axios docs](https://axios-http.com/docs/cancellation) for more.
 *
 * @param url - Request URL
 * @param data - Request data used for the body of the request
 * @param config - Request config. See [Axios docs](https://axios-http.com/docs/req_config)
 * @returns [state, request] - Array consisting of a `state` object and a
 * `request` function to initiate a POST request.
 */
export const usePost = <T, D = unknown>(
  url: string,
  data?: D,
  config?: Omit<AxiosRequestConfig<D>, "method" | "url" | "data" | "signal">
) => {
  return useAxios<T, D>(
    useMemo(
      () => ({ ...config, method: "post", url, data }),
      [config, data, url]
    )
  );
};

/**
 * Returns a message from a request error.
 * @param error - Request error
 */
export const getRequestErrorMessage = <T, D>(
  error: AxiosError<T, D> | Error | undefined
): string | undefined => {
  let errorMessage: string | undefined;
  if (error) {
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.statusText;
    } else {
      errorMessage = error.message;
    }
  }
  return errorMessage;
};
