// src/staff/components/schedule/ShiftModal.tsx

import { useState } from "react";
import type { Shift } from "../../types/schedule";
import type { Booking } from "../../types/bookings";
import { DAYS_FULL, START_OPTIONS, END_OPTIONS } from "../../types/schedule";

interface Props {
  dayIndex: number;
  current: Shift | null;
  dayBookings: Booking[]; // pending-записи на этот день
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

  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h === 0 && m === 0 ? 24 * 60 : h * 60 + m;
  };

  const handleSave = () => {
    const sh = timeToMin(start);
    const eh = timeToMin(end);

    if (eh <= sh) {
      setError("Конец смены должен быть позже начала");
      return;
    }

    // Проверяем конфликт с записями
    const conflict = dayBookings.find((b) => {
      const bs = timeToMin(b.start);
      const be = timeToMin(b.end);
      // Запись выходит за рамки новой смены
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
