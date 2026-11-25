import { useCallback, useEffect, useRef, useState } from "react";
import { MutationKey, QueryKey, useQueryClient } from "@tanstack/react-query";

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { name?: string; code?: string };
  return (
    err.name === "CanceledError" ||
    err.name === "AbortError" ||
    err.code === "ERR_CANCELED"
  );
}

export function defaultMergePatch<TPatch>(pending: TPatch, next: TPatch): TPatch {
  if (
    pending &&
    next &&
    typeof pending === "object" &&
    typeof next === "object" &&
    !Array.isArray(pending) &&
    !Array.isArray(next)
  ) {
    return { ...pending, ...next };
  }
  return next;
}

export interface UseCoalescedMutationOptions<TData, TPatch, TResult = TData> {
  queryKey: QueryKey;
  mutationKey: MutationKey;
  mutationFn: (payload: TPatch, signal: AbortSignal) => Promise<TResult>;
  applyOptimistic: (current: TData, patch: TPatch) => TData;
  mergePatch?: (pending: TPatch, next: TPatch) => TPatch;
  isNoOp?: (confirmed: TData, currentOptimistic: TData) => boolean;
  onSettledSuccess?: (
    result: TResult,
    payload: TPatch,
    current: TData | undefined
  ) => TData | undefined;
  invalidateKeys?: QueryKey[];
  debounceMs?: number;
  onSuccess?: (result: TResult, payload: TPatch) => void;
  onError?: (error: unknown, payload: TPatch) => void;
}

/**
 * Deep module for high-frequency toggle/preference interactions.
 * Applies optimistic cache updates synchronously on every tap while coalescing
 * rapid bursts via a trailing debounce, no-op diff guard, and AbortController.
 */
export function useCoalescedMutation<TData, TPatch, TResult = TData>({
  queryKey,
  mutationFn,
  applyOptimistic,
  mergePatch = defaultMergePatch,
  isNoOp,
  onSettledSuccess,
  invalidateKeys,
  debounceMs = 350,
  onSuccess,
  onError,
}: UseCoalescedMutationOptions<TData, TPatch, TResult>) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<TPatch | null>(null);
  const confirmedSnapshotRef = useRef<TData | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef(0);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const payload = pendingPatchRef.current;
    if (payload === null) return;
    pendingPatchRef.current = null;

    const currentCache = queryClient.getQueryData<TData>(queryKey);
    const confirmed = confirmedSnapshotRef.current;

    if (
      confirmed !== undefined &&
      currentCache !== undefined &&
      isNoOp?.(confirmed, currentCache) &&
      !abortControllerRef.current
    ) {
      confirmedSnapshotRef.current = undefined;
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++activeRequestIdRef.current;

    if (mountedRef.current) {
      setIsPending(true);
    }

    try {
      const result = await mutationFn(payload, controller.signal);

      if (requestId !== activeRequestIdRef.current) return;
      abortControllerRef.current = null;

      if (pendingPatchRef.current === null) {
        const latestCache = queryClient.getQueryData<TData>(queryKey);
        const reconciled = onSettledSuccess
          ? onSettledSuccess(result, payload, latestCache)
          : latestCache;

        if (reconciled !== undefined && onSettledSuccess) {
          queryClient.setQueryData<TData>(queryKey, reconciled);
        }
        confirmedSnapshotRef.current = undefined;
      }

      if (mountedRef.current) {
        onSuccess?.(result, payload);
      }

      if (invalidateKeys?.length) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    } catch (error) {
      if (isAbortError(error)) return;
      if (requestId !== activeRequestIdRef.current) return;

      abortControllerRef.current = null;
      if (confirmedSnapshotRef.current !== undefined) {
        queryClient.setQueryData<TData>(queryKey, confirmedSnapshotRef.current);
        confirmedSnapshotRef.current = undefined;
      }

      if (mountedRef.current) {
        onError?.(error, payload);
      }
    } finally {
      if (requestId === activeRequestIdRef.current && mountedRef.current) {
        setIsPending(false);
      }
    }
  }, [
    invalidateKeys,
    isNoOp,
    mutationFn,
    onError,
    onSettledSuccess,
    onSuccess,
    queryClient,
    queryKey,
  ]);

  const trigger = useCallback(
    (patch: TPatch) => {
      queryClient.cancelQueries({ queryKey });

      if (
        confirmedSnapshotRef.current === undefined &&
        timerRef.current === null &&
        abortControllerRef.current === null
      ) {
        confirmedSnapshotRef.current = queryClient.getQueryData<TData>(queryKey);
      }

      queryClient.setQueryData<TData>(queryKey, (prev) => {
        if (prev === undefined) return prev;
        return applyOptimistic(prev, patch);
      });

      pendingPatchRef.current =
        pendingPatchRef.current !== null
          ? mergePatch(pendingPatchRef.current, patch)
          : patch;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        void flush();
      }, debounceMs);
    },
    [applyOptimistic, debounceMs, flush, mergePatch, queryClient, queryKey]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pendingPatchRef.current !== null) {
        void flush();
      }
    };
  }, [flush]);

  return {
    trigger,
    isPending,
    flush,
  };
}
