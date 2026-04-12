import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStaffContext } from "../../layout/StaffLayout";
import { staffApi } from "../../../api/endpoints";
import { tokenStorage } from "../../../api/client";
import type { Booking, BookingStatus } from "../../types/bookings";
import { STATUS_MAP } from "../../types/bookings";
import type { Booking as ApiBooking, Slot } from "../../../api/types";

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
  onUpdate?: (
    id: number,
    serviceId: string,
    serviceName: string,
    timeStart: string,
    start: string,
    end: string,
  ) => void;
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

  const formatDateLocal = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
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
                    {formatDateLocal(v.time_start.slice(0, 10))}
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

function ConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <DrawerPortal>
      <div className="staff-overlay" onClick={onCancel} />
      <div className="staff-modal" style={{ width: 340 }}>
        <div className="staff-modal__header">
          <span className="staff-modal__title">Подтверждение</span>
          <button className="staff-modal__close" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div className="nb-form">
          <p
            style={{ margin: 0, fontSize: 14, color: "#444", lineHeight: 1.5 }}
          >
            Вы уверены? Запись будет убрана из расписания.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="drawer-btn drawer-btn--cancel"
              style={{ flex: 1 }}
              onClick={onConfirm}
            >
              Да, уверен
            </button>
            <button
              className="drawer-btn drawer-btn--change"
              style={{ flex: 1 }}
              onClick={onCancel}
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </DrawerPortal>
  );
}

function EditBookingModal({
  booking,
  onClose,
  onSave,
}: {
  booking: Booking;
  onClose: () => void;
  onSave: (
    serviceId: string,
    serviceName: string,
    timeStart: string,
    start: string,
    end: string,
  ) => void;
}) {
  const { services: contextServices } = useStaffContext();
  const activeServices = contextServices.filter((s) => s.active);

  // Если бэкенд не вернул service_id — ищем по названию услуги
  const resolvedServiceId =
    booking.serviceId ||
    activeServices.find(
      (s) => s.name.toLowerCase() === booking.service.toLowerCase(),
    )?.id ||
    "";

  const [selectedServiceId, setSelectedServiceId] = useState(resolvedServiceId);
  const [selectedDate, setSelectedDate] = useState(booking.date ?? "");
  // FIX: инициализируем текущим временем записи, а не пустой строкой
  const [selectedTime, setSelectedTime] = useState(booking.start ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const barberId = tokenStorage.getBarberId() ?? "";
  const selectedService = activeServices.find(
    (s) => s.id === selectedServiceId,
  );

  const slotToLabel = (sl: Slot) => {
    const d = new Date(sl.time_start);
    return (
      String(d.getUTCHours()).padStart(2, "0") +
      ":" +
      String(d.getUTCMinutes()).padStart(2, "0")
    );
  };

  useEffect(() => {
    if (!selectedDate || !barberId) return;
    setLoadingSlots(true);
    setSlots([]);
    setSlotsLoaded(false);

    const dur =
      activeServices.find((s) => s.id === selectedServiceId)?.duration ?? 0;

    staffApi
      .getSlots(selectedDate)
      .then(({ slots: allSlots }) => {
        const available = allSlots.filter((sl) => {
          if (sl.status === "free") return true;
          if (
            sl.status === "booked" &&
            sl.booking?.booking_id === booking.apiId
          )
            return true;
          return false;
        });

        let finalSlots: Slot[];
        if (dur > 0 && selectedServiceId) {
          finalSlots = available.filter((sl) => {
            const start = new Date(sl.time_start).getTime();
            const slotsNeeded = Math.ceil(dur / 15);
            for (let i = 0; i < slotsNeeded; i++) {
              const match = allSlots.find(
                (s) =>
                  Math.abs(
                    new Date(s.time_start).getTime() -
                      (start + i * 15 * 60 * 1000),
                  ) < 30000,
              );
              if (!match) return false;
              if (
                match.status === "booked" &&
                match.booking?.booking_id !== booking.apiId
              )
                return false;
            }
            return true;
          });
        } else {
          finalSlots = available;
        }

        setSlots(finalSlots);
        // FIX: сохраняем текущее время если оно есть среди доступных слотов,
        // иначе сбрасываем только если дата/услуга изменились пользователем
        setSelectedTime((prev) => {
          const exists = finalSlots.some((sl) => slotToLabel(sl) === prev);
          return exists ? prev : "";
        });
      })
      .catch(() => {
        setSlots([]);
        setSelectedTime("");
      })
      .finally(() => {
        setLoadingSlots(false);
        setSlotsLoaded(true);
      });
  }, [selectedDate, selectedServiceId, barberId]);

  const handleSave = async () => {
    if (!selectedServiceId) {
      setError("Выберите услугу");
      return;
    }
    if (!selectedDate) {
      setError("Выберите дату");
      return;
    }
    if (!selectedTime) {
      setError("Выберите время");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const [y, mo, day] = selectedDate.split("-").map(Number);
      const [h, m] = selectedTime.split(":").map(Number);
      const timeStart = new Date(Date.UTC(y, mo - 1, day, h, m)).toISOString();
      const dur = selectedService?.duration ?? 45;
      const endTotal = h * 60 + m + dur;
      const endStr =
        String(Math.floor(endTotal / 60)).padStart(2, "0") +
        ":" +
        String(endTotal % 60).padStart(2, "0");
      onSave(
        selectedServiceId,
        selectedService?.name ?? booking.service,
        timeStart,
        selectedTime,
        endStr,
      );
      onClose();
    } catch {
      setError("Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <DrawerPortal>
      <div className="staff-overlay" onClick={onClose} />
      <div className="staff-modal" style={{ width: 400 }}>
        <div className="staff-modal__header">
          <span className="staff-modal__title">Редактировать запись</span>
          <button className="staff-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="nb-form">
          <div className="nb-field">
            <label className="nb-field__label">Клиент</label>
            <div className="nb-field__input nb-field__input--readonly">
              {booking.name}
            </div>
          </div>

          <div className="nb-field">
            <label className="nb-field__label">Услуга</label>
            {activeServices.length === 0 ? (
              <div
                className="nb-field__input nb-field__input--readonly"
                style={{ color: "#bbb" }}
              >
                Нет активных услуг
              </div>
            ) : (
              <select
                className="nb-field__input"
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  // При смене услуги сбрасываем время — слоты пересчитаются
                  setSelectedTime("");
                }}
              >
                <option value="">— выбрать —</option>
                {activeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="nb-row">
            <div className="nb-field">
              <label className="nb-field__label">Дата</label>
              <input
                className="nb-field__input"
                type="date"
                min={todayIso}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  // При смене даты сбрасываем время
                  setSelectedTime("");
                }}
              />
            </div>
            <div className="nb-field">
              <label className="nb-field__label">Время</label>
              {loadingSlots ? (
                <div
                  className="nb-field__input nb-field__input--readonly"
                  style={{ color: "#aaa" }}
                >
                  Загрузка...
                </div>
              ) : slots.length === 0 ? (
                <div
                  className="nb-field__input nb-field__input--readonly"
                  style={{ color: "#bbb" }}
                >
                  {selectedDate && selectedServiceId
                    ? "Нет свободных слотов"
                    : "Выберите услугу и дату"}
                </div>
              ) : (
                <select
                  className="nb-field__input"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                >
                  <option value="">— выбрать —</option>
                  {slots.map((sl) => {
                    const label = slotToLabel(sl);
                    return (
                      <option key={sl.time_start} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>

          {error && <div className="nb-error">{error}</div>}

          <button
            className="staff-btn staff-btn--primary nb-submit"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
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
  onUpdate,
}: Props) {
  const { clients, updateNotes } = useStaffContext();
  const getNotes = (phone: string) =>
    clients.find((c) => c.phone === phone)?.notes ?? "";

  const [showHistory, setShowHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);

  const prevIdRef = React.useRef(booking?.id);
  if (prevIdRef.current !== booking?.id) {
    prevIdRef.current = booking?.id;
    setShowStatusPicker(false);
    setShowEdit(false);
    setConfirmAction(null);
  }

  const requestConfirm = (action: () => void) => {
    setConfirmAction(() => action);
  };

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
                <button
                  className="drawer-btn drawer-btn--change"
                  onClick={() => setShowEdit(true)}
                >
                  Редактировать
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="drawer-btn drawer-btn--noshow"
                    style={{ flex: 1, padding: "7px", fontSize: "10px" }}
                    onClick={() =>
                      requestConfirm(() => {
                        onDelete?.(booking.id);
                        onClose();
                      })
                    }
                  >
                    Не пришёл
                  </button>
                  <button
                    className="drawer-btn drawer-btn--noshow"
                    style={{ flex: 1, padding: "7px", fontSize: "10px" }}
                    onClick={() =>
                      requestConfirm(() => {
                        onDelete?.(booking.id);
                        onClose();
                      })
                    }
                  >
                    Отменить
                  </button>
                </div>
                <button
                  className="drawer-btn"
                  style={{
                    fontSize: "10px",
                    padding: "7px",
                    color: "#c00",
                    background: "#fff",
                    border: "1.5px solid #f0d0d0",
                  }}
                  onClick={() =>
                    requestConfirm(() => {
                      onDelete?.(booking.id);
                      onClose();
                    })
                  }
                >
                  Удалить запись
                </button>
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
                    <button
                      className="drawer-btn"
                      style={{
                        fontSize: "10px",
                        padding: "7px",
                        color: "#c00",
                        background: "#fff",
                        border: "1.5px solid #f0d0d0",
                      }}
                      onClick={() =>
                        requestConfirm(() => {
                          onDelete?.(booking.id);
                          onClose();
                        })
                      }
                    >
                      Удалить запись
                    </button>
                  </>
                ) : (
                  <>
                    <p className="drawer__picker-label">
                      Выберите новый статус
                    </p>
                    {STATUS_LABELS.map((s) => (
                      <button
                        key={s.value}
                        className={`drawer-btn drawer-btn--${
                          s.value === "completed"
                            ? "complete"
                            : s.value === "cancelled"
                              ? "cancel"
                              : s.value === "no_show"
                                ? "noshow"
                                : "change"
                        }`}
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

            {confirmAction && (
              <ConfirmModal
                onConfirm={() => {
                  confirmAction();
                  setConfirmAction(null);
                }}
                onCancel={() => setConfirmAction(null)}
              />
            )}

            {showEdit && (
              <EditBookingModal
                booking={booking}
                onClose={() => setShowEdit(false)}
                onSave={(serviceId, serviceName, timeStart, start, end) => {
                  onUpdate?.(
                    booking.id,
                    serviceId,
                    serviceName,
                    timeStart,
                    start,
                    end,
                  );
                }}
              />
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
