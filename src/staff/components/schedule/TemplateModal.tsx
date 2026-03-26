// src/staff/components/schedule/TemplateModal.tsx

import { useState } from "react";
import type { Shift, Template } from "../../types/schedule";
import { DAYS_FULL } from "../../types/schedule";

interface Props {
  template: Template | null; // null = новый шаблон
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

  const handleSave = () => {
    for (let i = 0; i < 7; i++) {
      if (!days[i].off) {
        const sh = parseInt(days[i].start);
        const eh = days[i].end === "00:00" ? 24 : parseInt(days[i].end);
        if (eh <= sh) {
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
      <div className="staff-modal" style={{ width: 500 }}>
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
                <input
                  type="time"
                  className="nb-field__input"
                  value={day.start}
                  disabled={day.off}
                  onChange={(e) => updateDay(i, { start: e.target.value })}
                  style={{ width: 110 }}
                />
                <span style={{ color: "#aaa" }}>—</span>
                <input
                  type="time"
                  className="nb-field__input"
                  value={day.end}
                  disabled={day.off}
                  onChange={(e) => updateDay(i, { end: e.target.value })}
                  style={{ width: 110 }}
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
