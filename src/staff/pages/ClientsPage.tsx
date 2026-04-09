import { useState, useMemo, useEffect } from "react";
import { useStaffContext } from "../layout/StaffLayout";
import type { Client } from "../layout/StaffLayout";
import { staffApi } from "../../api/endpoints";
import type { Booking as ApiBooking } from "../../api/types";
import "../../staff-styles/clients.css";

// Компонент истории посещений – реальный API
function HistoryModal({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 5;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    staffApi
      .getClientBookings(client.phone, PAGE_SIZE, page * PAGE_SIZE)
      .then(({ bookings: items, total: totalCount }) => {
        if (!cancelled) {
          setBookings(items);
          setTotal(totalCount);
        }
      })
      .catch((err) => {
        console.error("Failed to load client bookings", err);
        if (!cancelled) {
          setBookings([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client.phone, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows: (ApiBooking | null)[] = [...bookings];
  while (rows.length < PAGE_SIZE) rows.push(null);

  const count = total;
  const countLabel = count === 1 ? "визит" : count < 5 ? "визита" : "визитов";

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  };

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const STATUS_LABELS: Record<string, string> = {
    completed: "Выполнено",
    cancelled: "Отменено",
    no_show: "Не пришёл",
    pending: "Ожидает",
  };

  return (
    <>
      <div className="staff-overlay" onClick={onClose} />
      <div className="staff-modal" style={{ width: 500 }}>
        <div className="staff-modal__header">
          <span className="staff-modal__title">{client.name}</span>
          <button className="staff-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="history-count">
          {count} {countLabel}
        </div>
        <div style={{ minHeight: 280 }}>
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
                    {STATUS_LABELS[v.status] ?? ""}
                  </span>
                  <span className="history-item__service">
                    {v.service_name}
                  </span>
                  <span className="history-item__time">
                    {formatDateTime(v.time_start)}
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
    </>
  );
}

// Компонент редактирования описания (без изменений)
function NotesModal({
  client,
  onSave,
  onClose,
}: {
  client: Client;
  onSave: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(client.notes);

  return (
    <>
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
              {client.name}
            </div>
          </div>
          <div className="nb-field">
            <label className="nb-field__label">Описание</label>
            <textarea
              className="nb-field__input"
              rows={4}
              placeholder="Введите описание..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>
          <button
            className="staff-btn staff-btn--primary"
            onClick={() => {
              onSave(notes);
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

// Компонент подтверждения удаления (без изменений)
function ConfirmDeleteModal({
  client,
  onConfirm,
  onCancel,
}: {
  client: Client;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="staff-overlay" onClick={onCancel} />
      <div className="staff-modal staff-modal--sm">
        <div className="staff-modal__header">
          <span className="staff-modal__title">Удалить клиента</span>
          <button className="staff-modal__close" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div className="staff-modal__body">
          <p style={{ marginBottom: 20, fontSize: 13 }}>
            Вы уверены, что хотите удалить клиента{" "}
            <strong>{client.name}</strong>?
            <br />
            Все его записи останутся, но клиент исчезнет из базы.
          </p>
          <div className="staff-modal__actions">
            <button className="staff-btn staff-btn--danger" onClick={onConfirm}>
              Да, удалить
            </button>
            <button
              className="staff-btn staff-btn--secondary"
              onClick={onCancel}
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Основная страница
export default function ClientsPage() {
  const { clients, setClients, updateNotes } = useStaffContext();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<Client | null>(null);
  const [notesClient, setNotesClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? clients.filter(
          (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
        )
      : clients;
  }, [clients, query]);

  const handleDelete = async (client: Client) => {
    if (!client.apiId) return;
    try {
      await staffApi.deleteClient(client.apiId);
      setClients((prev) => prev.filter((c) => c.apiId !== client.apiId));
    } catch (err) {
      console.error("Failed to delete client", err);
      alert("Не удалось удалить клиента");
    }
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <p className="staff-page-header__sub">База</p>
          <h1 className="staff-page-header__title">Клиенты</h1>
        </div>
      </div>

      <div className="search-wrap">
        <input
          className="search-input"
          type="text"
          placeholder="Поиск по имени или телефону..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="client-list">
        <div className="client-row client-row--head">
          <span>Имя</span>
          <span>Телефон</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <div className="clients-empty">Ничего не найдено</div>
        )}

        {filtered.map((c) => (
          <div key={c.id} className="client-row">
            <span className="client-row__name">{c.name}</span>
            <span className="client-row__phone">{c.phone}</span>
            <div className="client-row__actions">
              <button
                className="row-btn client-btn client-btn--notes"
                onClick={() => setNotesClient(c)}
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
                className="row-btn client-btn client-btn--history"
                onClick={() => setHistory(c)}
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
              <button
                className="row-btn client-btn client-btn--delete"
                onClick={() => setDeleteConfirm(c)}
                style={{ color: "#c00", borderColor: "#f0d0d0" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {history && (
        <HistoryModal client={history} onClose={() => setHistory(null)} />
      )}
      {notesClient && (
        <NotesModal
          client={notesClient}
          onSave={(notes) => updateNotes(notesClient.phone, notes)}
          onClose={() => setNotesClient(null)}
        />
      )}
      {deleteConfirm && (
        <ConfirmDeleteModal
          client={deleteConfirm}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
