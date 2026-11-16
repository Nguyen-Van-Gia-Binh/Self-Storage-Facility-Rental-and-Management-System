import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || year < 1000) return false;
  const probe = new Date(year, month - 1, day);
  return probe.getFullYear() === year && probe.getMonth() === month - 1 && probe.getDate() === day;
}

/** `yyyy-MM-dd` -> `dd/MM/yyyy`. Chuỗi khác trả về rỗng. Không dùng `new Date(iso)`. */
export function toVnDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isRealDate(year, month, day)) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** `dd/MM/yyyy` hoặc `yyyy-MM-dd` -> `yyyy-MM-dd`. Rỗng là xóa. Sai trả về null. */
export function parseVnDate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (vn) {
    const day = Number(vn[1]);
    const month = Number(vn[2]);
    const year = Number(vn[3]);
    if (!isRealDate(year, month, day)) return null;
    return `${vn[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!iso) return null;
  const year = Number(iso[1]);
  const month = Number(iso[2]);
  const day = Number(iso[3]);
  if (!isRealDate(year, month, day)) return null;
  return `${iso[1]}-${iso[2]}-${iso[3]}`;
}

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  min?: string;
  max?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

function splitWidth(className: string): { width: string; rest: string } {
  const width: string[] = [];
  const rest: string[] = [];
  for (const token of className.split(/\s+/)) {
    if (!token) continue;
    if (/^(?:w-|min-w-|max-w-)/.test(token)) width.push(token);
    else rest.push(token);
  }
  return { width: width.join(' '), rest: rest.join(' ') };
}

export const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  className = '',
  min,
  max,
  id,
  disabled,
  required,
  onKeyDown,
}) => {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => toVnDate(value));
  const { width, rest } = splitWidth(className);

  useEffect(() => {
    setText(toVnDate(value));
  }, [value]);

  function inRange(iso: string): boolean {
    if (!iso) return true;
    if (min && iso < min) return false;
    if (max && iso > max) return false;
    return true;
  }

  function commit(raw: string) {
    const next = parseVnDate(raw);
    if (next === null || !inRange(next)) {
      setText(toVnDate(value));
      return;
    }
    setText(next ? toVnDate(next) : '');
    if (next !== value) onChange(next);
  }

  return (
    <div className={`relative ${width || 'inline-block'}`}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/yyyy"
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        value={text}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          const next = parseVnDate(raw);
          if (next !== null && inRange(next) && next !== value) onChange(next);
        }}
        onBlur={() => commit(text)}
        onKeyDown={onKeyDown}
        className={`${rest} ${width ? 'w-full' : ''}`.trim()}
        style={{ paddingRight: '2.25rem' }}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Chọn ngày"
        onClick={() => {
          const picker = pickerRef.current;
          if (!picker || disabled) return;
          try {
            picker.showPicker();
          } catch {
            picker.focus();
          }
        }}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 disabled:opacity-40"
      >
        <Calendar className="w-4 h-4" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          if (!inRange(next)) return;
          onChange(next);
        }}
        className="sr-only"
      />
    </div>
  );
};
