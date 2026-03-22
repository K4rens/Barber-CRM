// src/staff/components/bookings/BookingDrawer.tsx

import type { Booking, BookingStatus } from "../../types/bookings";
import { STATUS_MAP } from "../../types/bookings";

interface Props {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange: (id: number, status: BookingStatus) => void;
}

const STATUS_LABELS: { value: BookingStatus; label: string }[] = [
  { value: "completed", label: "Завершено" },
  { value: "no_show", label: "Не пришёл" },
  { value: "cancelled", label: "Отменено" },
  { value: "pending", label: "Ожидает" },
];

export default function BookingDrawer({
  booking,
  onClose,
  onStatusChange,
}: Props) {
  if (!booking) return null;

  const isPending = booking.status === "pending";

  return (
    <>
      <div className="staff-overlay" onClick={onClose} />
      <div className="drawer drawer--open">
        <div className="drawer__header">
          <h2 className="drawer__title">{booking.name}</h2>
          <button className="drawer__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer__body">
          <div className="drawer__row">
            <span className="drawer__label">Телефон</span>
            <span className="drawer__value">{booking.phone}</span>
          </div>
          <div className="drawer__row">
            <span className="drawer__label">Услуга</span>
            <span className="drawer__value">{booking.service}</span>
          </div>
          <div className="drawer__row">
            <span className="drawer__label">Время</span>
            <span className="drawer__value">
              {booking.start} — {booking.end}
            </span>
          </div>
          <div className="drawer__row">
            <span className="drawer__label">Статус</span>
            <span className="drawer__value">{STATUS_MAP[booking.status]}</span>
          </div>
        </div>

        {/* Действия для pending */}
        {isPending && (
          <div className="drawer__actions">
            <button
              className="drawer-btn drawer-btn--complete"
              onClick={() => onStatusChange(booking.id, "completed")}
            >
              Завершить
            </button>
            <button
              className="drawer-btn drawer-btn--noshow"
              onClick={() => onStatusChange(booking.id, "no_show")}
            >
              Не пришёл
            </button>
            <button
              className="drawer-btn drawer-btn--cancel"
              onClick={() => onStatusChange(booking.id, "cancelled")}
            >
              Отменить
            </button>
          </div>
        )}

        {/* Изменить статус для остальных */}
        {!isPending && (
          <div className="drawer__actions">
            <details className="drawer__status-picker-details">
              <summary className="drawer-btn drawer-btn--change">
                Изменить статус
              </summary>
              <div className="drawer__status-picker">
                <p className="drawer__picker-label">Выберите новый статус</p>
                {STATUS_LABELS.map((s) => (
                  <button
                    key={s.value}
                    className={`drawer-btn drawer-btn--${s.value === "completed" ? "complete" : s.value === "cancelled" ? "cancel" : s.value === "no_show" ? "noshow" : "change"}`}
                    onClick={() => onStatusChange(booking.id, s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </>
  );
}
