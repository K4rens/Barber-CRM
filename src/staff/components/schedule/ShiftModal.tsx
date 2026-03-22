// src/staff/components/schedule/ShiftModal.tsx

import { useState } from "react";
import type { Shift } from "../../types/schedule";
import { DAYS_FULL, START_OPTIONS, END_OPTIONS } from "../../types/schedule";

interface Props {
  dayIndex: number;
  current: Shift | null;
  onSave: (shift: Shift | null) => void;
  onClose: () => void;
}

export default function ShiftModal({
  dayIndex,
  current,
  onSave,
  onClose,
}: Props) {
  const [start, setStart] = useState(current?.start ?? "09:00");
  const [end, setEnd] = useState(current?.end ?? "20:00");
  const [error, setError] = useState("");

  const handleSave = () => {
    const sh = parseInt(start);
    const eh = end === "00:00" ? 24 : parseInt(end);
    if (eh <= sh) {
      setError("Конец смены должен быть позже начала");
      return;
    }
    onSave({ start, end });
    onClose();
  };

  const handleSetOff = () => {
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
              <select
                className="nb-field__input"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              >
                {START_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="nb-field">
              <label className="nb-field__label">Конец смены</label>
              <select
                className="nb-field__input"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              >
                {END_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
