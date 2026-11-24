import * as React from 'react';
import { Input, Textarea } from './FormControls';

/**
 * Keeps a locally-controlled value so typing never fights an async
 * IndexedDB round-trip (no dropped characters / cursor jumps), then commits
 * to the store on a short debounce and on blur. The external `value` only
 * re-syncs into the field while it is NOT focused.
 */
function useDebouncedCommit(
  value: string,
  onCommit: (next: string) => void,
  delay: number
) {
  const [local, setLocal] = React.useState(value);
  const focused = React.useRef(false);
  const timer = React.useRef<number | undefined>(undefined);
  const latest = React.useRef(value);
  latest.current = local;

  React.useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);

  React.useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const scheduleCommit = (next: string) => {
    setLocal(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onCommit(next), delay);
  };

  const handleFocus = () => {
    focused.current = true;
  };

  const handleBlur = () => {
    focused.current = false;
    if (timer.current) window.clearTimeout(timer.current);
    onCommit(latest.current);
  };

  return { local, scheduleCommit, handleFocus, handleBlur };
}

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> & {
  value: string;
  onCommit: (next: string) => void;
  delay?: number;
};

export function DebouncedInput({
  value,
  onCommit,
  delay = 450,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { local, scheduleCommit, handleFocus, handleBlur } = useDebouncedCommit(
    value,
    onCommit,
    delay
  );
  return (
    <Input
      {...props}
      value={local}
      onChange={(e) => scheduleCommit(e.target.value)}
      onFocus={(e) => {
        handleFocus();
        onFocus?.(e);
      }}
      onBlur={(e) => {
        handleBlur();
        onBlur?.(e);
      }}
    />
  );
}

type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> & {
  value: string;
  onCommit: (next: string) => void;
  delay?: number;
};

export function DebouncedTextarea({
  value,
  onCommit,
  delay = 450,
  onFocus,
  onBlur,
  ...props
}: TextareaProps) {
  const { local, scheduleCommit, handleFocus, handleBlur } = useDebouncedCommit(
    value,
    onCommit,
    delay
  );
  return (
    <Textarea
      {...props}
      value={local}
      onChange={(e) => scheduleCommit(e.target.value)}
      onFocus={(e) => {
        handleFocus();
        onFocus?.(e);
      }}
      onBlur={(e) => {
        handleBlur();
        onBlur?.(e);
      }}
    />
  );
}
