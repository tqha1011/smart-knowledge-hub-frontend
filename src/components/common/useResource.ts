import { useCallback, useEffect, useRef, useState } from "react";
import { toErrorMessage } from "../../shared/handleApiError";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

// Local request state only: keep the last successful response for a refetch
// of the same resource, and never present it as a different page or resource.
export function useResource<T>(
  key: string,
  loader: () => Promise<T>,
  refreshSignal = 0,
  enabled = true,
) {
  const [state, setState] = useState<{
    key: string;
    data: T | null;
    error: string | null;
    isLoading: boolean;
  }>({ key, data: null, error: null, isLoading: true });
  const generation = useRef({ value: 0 });
  const currentResource = useRef({ key, loader, active: false });

  // Mutation callbacks can outlive the page that opened their panel. A stable
  // reload always targets the currently committed resource, never that old page.
  const reload = useCallback(async () => {
    if (!currentResource.current.active) return;
    const { key, loader } = currentResource.current;
    const request = ++generation.current.value;
    setState((previous) => ({
      key,
      data: previous.key === key ? previous.data : null,
      error: null,
      isLoading: true,
    }));
    try {
      const data = await loader();
      if (request === generation.current.value) {
        setState({ key, data, error: null, isLoading: false });
        return data;
      }
    } catch (error) {
      if (request === generation.current.value)
        setState((previous) => ({
          ...previous,
          error: toErrorMessage(error as ApiErrorResponse),
          isLoading: false,
        }));
    }
  }, []);

  useEffect(() => {
    let active = true;
    const counter = generation.current;
    const current = currentResource.current;
    current.key = key;
    current.loader = loader;
    current.active = true;
    if (enabled)
      void Promise.resolve().then(() => {
        if (active) void reload();
      });
    return () => {
      active = false;
      current.active = false;
      counter.value++;
    };
  }, [key, loader, reload, refreshSignal, enabled]);

  const current =
    state.key === key
      ? state
      : { key, data: null, error: null, isLoading: true };
  return { ...current, reload };
}
