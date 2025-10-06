import { useEffect, useRef, useState, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  const save = useCallback(async () => {
    if (!enabled) return;

    setStatus('saving');
    try {
      await onSave(data);
      setStatus('saved');
      // Reset to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setStatus('error');
      // Reset to idle after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
      previousDataRef.current = data;
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, save]);

  return { status, save: () => save() };
}
