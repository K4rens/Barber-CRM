import { useState, useRef, useEffect, useCallback } from "react";
import type { Shift } from "../../types/schedule";
import type { Booking } from "../../types/bookings";
import { DAYS_FULL } from "../../types/schedule";

const TIME_OPTIONS = (() => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
})();

const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minExclusive?: string;
}

function TimeSelect({
  value,
  onChange,
  disabled = false,
  minExclusive,
}: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const options = minExclusive
    ? TIME_OPTIONS.filter((t) => timeToMin(t) > timeToMin(minExclusive))
    : TIME_OPTIONS;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const idx = options.indexOf(value);
    if (idx === -1) return;
    const item = listRef.current.children[idx] as HTMLElement;
    if (item) {
      listRef.current.scrollTop =
        item.offsetTop -
        listRef.current.clientHeight / 2 +
        item.clientHeight / 2;
    }
  }, [open, value, options]);

  const handleSelect = useCallback(
    (t: string) => {
      onChange(t);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block", width: "100%" }}
    >
      <button
        type="button"
        className="nb-field__input time-select"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          width: "100%",
          appearance: "none",
          WebkitAppearance: "none",
        }}
      >
        <span>{value}</span>
        <span
          style={{
            marginLeft: 6,
            fontSize: 10,
            opacity: 0.5,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            display: "inline-block",
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 9999,
            margin: "4px 0 0",
            padding: 0,
            listStyle: "none",
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 220,
            overflowY: "auto",
            minWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {options.map((t) => (
            <li
              key={t}
              onMouseDown={() => handleSelect(t)}
              style={{
                padding: "7px 14px",
                cursor: "pointer",
                fontSize: 14,
                background: t === value ? "#1d4ed8" : "transparent",
                color: t === value ? "#fff" : "#111",
                fontWeight: t === value ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (t !== value)
                  (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                if (t !== value)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface Props {
  dayIndex: number;
  current: Shift | null;
  dayBookings: Booking[];
  onSave: (shift: Shift | null) => void;
  onClose: () => void;
}

export default function ShiftModal({
  dayIndex,
  current,
  dayBookings,
  onSave,
  onClose,
}: Props) {
  const [start, setStart] = useState(current?.start ?? "09:00");
  const [end, setEnd] = useState(current?.end ?? "20:00");
  const [error, setError] = useState("");


  const handleStartChange = (newStart: string) => {
    setStart(newStart);
    setError("");
    if (timeToMin(end) <= timeToMin(newStart)) {
      const nextIdx = TIME_OPTIONS.indexOf(newStart) + 12; 
      setEnd(TIME_OPTIONS[Math.min(nextIdx, TIME_OPTIONS.length - 1)]);
    }
  };

  const handleEndChange = (newEnd: string) => {
    setEnd(newEnd);
    setError("");
  };

  const handleSave = () => {
    const sh = timeToMin(start);
    const eh = timeToMin(end);

    if (eh <= sh) {
      setError("Конец смены должен быть позже начала");
      return;
    }

    const conflict = dayBookings.find((b) => {
      const bs = timeToMin(b.start);
      const be = timeToMin(b.end);
      return bs < sh || be > eh;
    });

    if (conflict) {
      setError(
        `Запись ${conflict.name.split(" ")[0]} (${conflict.start}–${conflict.end}) не вписывается в новое время смены`,
      );
      return;
    }

    onSave({ start, end });
    onClose();
  };

  const handleSetOff = () => {
    if (dayBookings.length > 0) {
      setError(
        `Нельзя поставить выходной — есть ${dayBookings.length} запис${dayBookings.length === 1 ? "ь" : "и"}`,
      );
      return;
    }
    onSave(null);
    onClose();
  };

  return (
    <>
      <div className="staff-overlay" onClick={onClose} />
      <div className="staff-modal" style={{ width: 320 }}>
        <div className="staff-modal__header">
          <span className="staff-modal__title">{DAYS_FULL[dayIndex]}</span>
          <button className="staff-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="nb-form">
          <div className="nb-row">
            <div className="nb-field">
              <label className="nb-field__label">Начало смены</label>
              <TimeSelect value={start} onChange={handleStartChange} />
            </div>
            <div className="nb-field">
              <label className="nb-field__label">Конец смены</label>
              <TimeSelect
                value={end}
                onChange={handleEndChange}
                minExclusive={start}
              />
            </div>
          </div>
          {error && <div className="nb-error">{error}</div>}
          <button className="staff-btn staff-btn--primary" onClick={handleSave}>
            Сохранить
          </button>
          <button
            className="staff-btn staff-btn--secondary"
            onClick={handleSetOff}
          >
            Сделать выходным
          </button>
        </div>
      </div>
    </>
  );
}
