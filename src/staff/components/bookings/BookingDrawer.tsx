// src/staff/components/bookings/BookingDrawer.tsx
import React from "react";
import { useState } from "react";
import { useStaffContext } from "../../layout/StaffLayout";
import type { Booking, BookingStatus } from "../../types/bookings";
import { STATUS_MAP, MOCK_BOOKINGS } from "../../types/bookings";

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

const STATUS_VISIT_LABELS: Record<string, string> = {
  completed: "Выполнено",
  cancelled: "Отменено",
  no_show: "Не пришёл",
  pending: "Ожидает",
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// ── Модалка истории ───────────────────────────────────────────

function HistoryModal({
  name,
  phone,
  onClose,
}: {
  name: string;
  phone: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  const visits = MOCK_BOOKINGS.filter(
    (b) =>
      b.name === name && b.phone === phone && b.status !== "pending" && b.date,
  ).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const totalPages = Math.max(1, Math.ceil(visits.length / PAGE_SIZE));
  const slice = visits.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const rows: (Booking | null)[] = [...slice];
  while (rows.length < PAGE_SIZE) rows.push(null);

  const count = visits.length;
  const countLabel = count === 1 ? "визит" : count < 5 ? "визита" : "визитов";

  return (
    <>
      <div
        className="staff-overlay"
        style={{ zIndex: 201 }}
        onClick={onClose}
      />
      <div className="staff-modal" style={{ width: 420, zIndex: 202 }}>
        <div className="staff-modal__header">
          <span className="staff-modal__title">{name}</span>
          <button className="staff-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="history-count">
          {count} {countLabel}
        </div>
        <div style={{ minHeight: 240 }}>
          {count === 0 ? (
            <div className="history-empty">Нет посещений</div>
          ) : (
            rows.map((v, i) =>
              v ? (
                <div key={i} className="history-item">
                  <span className="history-item__date">
                    {formatDate(v.date ?? "")}
                  </span>
                  <span className="history-item__status">
                    {STATUS_VISIT_LABELS[v.status] ?? ""}
                  </span>
                  <span className="history-item__service">{v.service}</span>
                </div>
              ) : (
                <div key={i} className="history-item history-item--empty">
                  &nbsp;
                </div>
              ),
            )
          )}
        </div>
        <div className="history-pagination">
          <button
            className="history-page-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            &#x276E;
          </button>
          <span className="history-page-label">
            {count === 0 ? "—" : `${page + 1} / ${totalPages}`}
          </span>
          <button
            className="history-page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            &#x276F;
          </button>
        </div>
      </div>
    </>
  );
}

// ── Модалка описания ──────────────────────────────────────────

function NotesModal({
  name,
  notes,
  onSave,
  onClose,
}: {
  name: string;
  notes: string;
  onSave: (n: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(notes);

  return (
    <>
      <div
        className="staff-overlay"
        style={{ zIndex: 201 }}
        onClick={onClose}
      />
      <div className="staff-modal" style={{ width: 380, zIndex: 202 }}>
        <div className="staff-modal__header">
          <span className="staff-modal__title">Описание клиента</span>
          <button className="staff-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="nb-form">
          <div className="nb-field">
            <label className="nb-field__label">Клиент</label>
            <div className="nb-field__input nb-field__input--readonly">
              {name}
            </div>
          </div>
          <div className="nb-field">
            <label className="nb-field__label">Описание</label>
            <textarea
              className="nb-field__input"
              rows={4}
              placeholder="Введите описание..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>
          <button
            className="staff-btn staff-btn--primary"
            onClick={() => {
              onSave(value);
              onClose();
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </>
  );
}

// ── Дровер ────────────────────────────────────────────────────

export default function BookingDrawer({
  booking,
  onClose,
  onStatusChange,
}: Props) {
  const { clients, updateNotes } = useStaffContext();
  const getNotes = (phone: string) =>
    clients.find((c) => c.phone === phone)?.notes ?? "";
  const [showHistory, setShowHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  // Сбрасываем при смене записи
  const prevIdRef = React.useRef(booking?.id);
  if (prevIdRef.current !== booking?.id) {
    prevIdRef.current = booking?.id;
    setShowStatusPicker(false);
  }

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

        {/* Описание и история */}
        <div className="drawer__client-actions">
          <button
            className="drawer-client-btn"
            onClick={() => setShowNotes(true)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Описание
          </button>
          <button
            className="drawer-client-btn drawer-client-btn--black"
            onClick={() => setShowHistory(true)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            История
          </button>
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
            {!showStatusPicker ? (
              <button
                className="drawer-btn drawer-btn--change"
                onClick={() => setShowStatusPicker(true)}
              >
                Изменить статус
              </button>
            ) : (
              <>
                <p className="drawer__picker-label">Выберите новый статус</p>
                {STATUS_LABELS.map((s) => (
                  <button
                    key={s.value}
                    className={`drawer-btn drawer-btn--${s.value === "completed" ? "complete" : s.value === "cancelled" ? "cancel" : s.value === "no_show" ? "noshow" : "change"}`}
                    onClick={() => {
                      onStatusChange(booking.id, s.value);
                      setShowStatusPicker(false);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {showHistory && (
        <HistoryModal
          name={booking.name}
          phone={booking.phone}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showNotes && (
        <NotesModal
          name={booking.name}
          notes={getNotes(booking.phone)}
          onSave={(n) => updateNotes(booking.phone, n)}
          onClose={() => setShowNotes(false)}
        />
      )}
    </>
  );
}
