import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStaffContext } from "../../layout/StaffLayout";
import { staffApi } from "../../../api/endpoints";
import type { Booking, BookingStatus } from "../../types/bookings";
import { STATUS_MAP } from "../../types/bookings";
import type { Booking as ApiBooking } from "../../../api/types";

function DrawerPortal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div
      className="staff-app"
      style={{ position: "static", minHeight: "unset", display: "contents" }}
    >
      {children}
    </div>,
    document.body,
  );
}

interface Props {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange: (id: number, status: BookingStatus) => void;
  onDelete?: (id: number) => void;
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

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

 function HistoryModal({
   phone,
   name,
   onClose,
 }: {
   phone: string;
   name: string;
   onClose: () => void;
 }) {
   const [page, setPage] = useState(0);
   const [visits, setVisits] = useState<ApiBooking[]>([]);
   const [loading, setLoading] = useState(true);
   const [total, setTotal] = useState(0);
   const PAGE_SIZE = 5;

   useEffect(() => {
     let cancelled = false;
     setLoading(true);
     staffApi
       .getClientBookings(phone, PAGE_SIZE, page * PAGE_SIZE)
       .then(({ bookings, total: totalCount }) => {
         if (!cancelled) {
           setVisits(bookings);
           setTotal(totalCount);
         }
       })
       .catch((err) => {
         console.error("Failed to load client bookings", err);
         if (!cancelled) {
           setVisits([]);
           setTotal(0);
         }
       })
       .finally(() => {
         if (!cancelled) setLoading(false);
       });
     return () => {
       cancelled = true;
     };
   }, [phone, page]);

   const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
   const rows: (ApiBooking | null)[] = [...visits];
   while (rows.length < PAGE_SIZE) rows.push(null);

   const count = total;
   const countLabel = count === 1 ? "визит" : count < 5 ? "визита" : "визитов";

   const formatDate = (iso: string) => {
     const [y, m, d] = iso.split("-");
     return `${d}.${m}.${y}`;
   };

   const STATUS_VISIT_LABELS: Record<string, string> = {
     completed: "Выполнено",
     cancelled: "Отменено",
     no_show: "Не пришёл",
     pending: "Ожидает",
   };

   return (
     <DrawerPortal>
       <div className="staff-overlay" onClick={onClose} />
       <div className="staff-modal" style={{ width: 420 }}>
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
           {loading && (
             <div
               style={{ padding: "20px", textAlign: "center", color: "#aaa" }}
             >
               Загрузка...
             </div>
           )}
           {!loading && count === 0 && (
             <div className="history-empty">Нет посещений</div>
           )}
           {!loading &&
             rows.map((v, i) =>
               v ? (
                 <div key={v.booking_id} className="history-item">
                   <span className="history-item__date">
                     {formatDate(v.time_start.slice(0, 10))}
                   </span>
                   <span className="history-item__status">
                     {STATUS_VISIT_LABELS[v.status] ?? ""}
                   </span>
                   <span className="history-item__service">
                     {v.service_name}
                   </span>
                 </div>
               ) : (
                 <div key={i} className="history-item history-item--empty">
                   &nbsp;
                 </div>
               ),
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
             {total === 0 ? "—" : `${page + 1} / ${totalPages}`}
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
     </DrawerPortal>
   );
 }

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
    <DrawerPortal>
      <div className="staff-overlay" onClick={onClose} />
      <div className="staff-modal" style={{ width: 380 }}>
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
    </DrawerPortal>
  );
}

export default function BookingDrawer({
  booking,
  onClose,
  onStatusChange,
  onDelete,
}: Props) {
  const { clients, updateNotes } = useStaffContext();
  const getNotes = (phone: string) =>
    clients.find((c) => c.phone === phone)?.notes ?? "";

  const [showHistory, setShowHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const prevIdRef = React.useRef(booking?.id);
  if (prevIdRef.current !== booking?.id) {
    prevIdRef.current = booking?.id;
    setShowStatusPicker(false);
    setShowDeleteConfirm(false);
  }

  const isOpen = !!booking;
  const isPending = booking?.status === "pending";

  return (
    <>
      {isOpen && <div className="staff-overlay" onClick={onClose} />}

      <div className={`drawer${isOpen ? " drawer--open" : ""}`}>
        <div className="drawer__header">
          <h2 className="drawer__title">{booking?.name ?? ""}</h2>
          <button className="drawer__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {booking && (
          <>
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
                <span className="drawer__value">
                  {STATUS_MAP[booking.status]}
                </span>
              </div>
            </div>

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

            {isPending && (
              <div className="drawer__actions">
                <button
                  className="drawer-btn drawer-btn--complete"
                  onClick={() => onStatusChange(booking.id, "completed")}
                >
                  Завершить
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="drawer-btn drawer-btn--noshow"
                    style={{ flex: 1, padding: "7px", fontSize: "10px" }}
                    onClick={() => onStatusChange(booking.id, "no_show")}
                  >
                    Не пришёл
                  </button>
                  <button
                    className="drawer-btn drawer-btn--noshow"
                    style={{ flex: 1, padding: "7px", fontSize: "10px" }}
                    onClick={() => onStatusChange(booking.id, "cancelled")}
                  >
                    Отменить
                  </button>
                </div>
                {!showDeleteConfirm ? (
                  <button
                    className="drawer-btn drawer-btn--danger"
                    style={{
                      fontSize: "10px",
                      padding: "7px",
                      color: "#c00",
                      background: "#fff",
                      border: "1.5px solid #f0d0d0",
                    }}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Удалить запись
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="drawer-btn drawer-btn--cancel"
                      style={{ flex: 1, padding: "7px", fontSize: "10px" }}
                      onClick={() => {
                        onDelete?.(booking.id);
                        onClose();
                      }}
                    >
                      Да, удалить
                    </button>
                    <button
                      className="drawer-btn drawer-btn--change"
                      style={{ flex: 1, padding: "7px", fontSize: "10px" }}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isPending && (
              <div className="drawer__actions">
                {!showStatusPicker ? (
                  <>
                    <button
                      className="drawer-btn drawer-btn--change"
                      onClick={() => setShowStatusPicker(true)}
                    >
                      Изменить статус
                    </button>
                    {!showDeleteConfirm ? (
                      <button
                        className="drawer-btn"
                        style={{
                          fontSize: "10px",
                          padding: "7px",
                          color: "#c00",
                          background: "#fff",
                          border: "1.5px solid #f0d0d0",
                        }}
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        Удалить запись
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="drawer-btn drawer-btn--cancel"
                          style={{ flex: 1, padding: "7px", fontSize: "10px" }}
                          onClick={() => {
                            onDelete?.(booking.id);
                            onClose();
                          }}
                        >
                          Да, удалить
                        </button>
                        <button
                          className="drawer-btn drawer-btn--change"
                          style={{ flex: 1, padding: "7px", fontSize: "10px" }}
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Отмена
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="drawer__picker-label">
                      Выберите новый статус
                    </p>
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

            {showHistory && (
              <HistoryModal
                phone={booking.phone}
                name={booking.name}
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
        )}
      </div>
    </>
  );
}
