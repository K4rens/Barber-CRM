import { useState, useRef, useEffect, useCallback } from "react";
import type { Shift, Template } from "../../types/schedule";
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
  template: Template | null;
  onSave: (days: (Shift | null)[]) => void;
  onClose: () => void;
}

interface DayState {
  off: boolean;
  start: string;
  end: string;
}

function toDayStates(days: (Shift | null)[]): DayState[] {
  return days.map((d) =>
    d
      ? { off: false, start: d.start, end: d.end }
      : { off: true, start: "09:00", end: "20:00" },
  );
}

export default function TemplateModal({ template, onSave, onClose }: Props) {
  const [days, setDays] = useState<DayState[]>(() =>
    template
      ? toDayStates(template.days)
      : Array.from({ length: 7 }, () => ({
          off: false,
          start: "09:00",
          end: "20:00",
        })),
  );
  const [error, setError] = useState("");

  const updateDay = (i: number, patch: Partial<DayState>) =>
    setDays((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    );

  const handleStartChange = (i: number, newStart: string) => {
    const day = days[i];
    const patch: Partial<DayState> = { start: newStart };
    if (timeToMin(day.end) <= timeToMin(newStart)) {
      const nextIdx = TIME_OPTIONS.indexOf(newStart) + 12; 
      patch.end = TIME_OPTIONS[Math.min(nextIdx, TIME_OPTIONS.length - 1)];
    }
    updateDay(i, patch);
    setError("");
  };

  const handleSave = () => {
    for (let i = 0; i < 7; i++) {
      if (!days[i].off) {
        const startMin = timeToMin(days[i].start);
        const endMin = timeToMin(days[i].end);
        if (endMin <= startMin) {
          setError(`Конец смены должен быть позже начала для ${DAYS_FULL[i]}`);
          return;
        }
      }
    }
    onSave(days.map((d) => (d.off ? null : { start: d.start, end: d.end })));
    onClose();
  };

  return (
    <>
      <div className="staff-overlay" onClick={onClose} />
      <div className="staff-modal template-modal">
        <div className="staff-modal__header">
          <span className="staff-modal__title">
            {template ? "Редактировать шаблон" : "Новый шаблон"}
          </span>
          <button className="staff-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="staff-modal__body">
          {days.map((day, i) => (
            <div key={i} className="template-day-row">
              <span className="day-name">{DAYS_FULL[i]}</span>
              <div className="time-inputs">
                <TimeSelect
                  value={day.start}
                  disabled={day.off}
                  onChange={(v) => handleStartChange(i, v)}
                />
                <span style={{ color: "#aaa" }}>—</span>
                <TimeSelect
                  value={day.end}
                  disabled={day.off}
                  onChange={(v) => updateDay(i, { end: v })}
                  minExclusive={day.start}
                />
              </div>
              <label className="off-checkbox">
                <input
                  type="checkbox"
                  checked={day.off}
                  onChange={(e) => updateDay(i, { off: e.target.checked })}
                />{" "}
                Выходной
              </label>
            </div>
          ))}
          {error && (
            <div className="nb-error" style={{ marginTop: 8 }}>
              {error}
            </div>
          )}
          <button
            className="staff-btn staff-btn--primary"
            style={{ marginTop: 16 }}
            onClick={handleSave}
          >
            Сохранить
          </button>
        </div>
      </div>
    </>
  );
}
