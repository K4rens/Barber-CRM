import { useState, useMemo } from "react";
import { useStaffContext } from "../layout/StaffLayout";
import type { Client } from "../layout/StaffLayout";
import "../../staff-styles/clients.css";

interface Visit {
  clientId: number;
  date: string;
  service: string;
  status: "completed" | "cancelled" | "no_show" | "pending";
}

const MOCK_VISITS: Visit[] = [];

const STATUS_LABELS: Record<string, string> = {
  completed: "Выполнено",
  cancelled: "Отменено",
  no_show: "Не пришёл",
  pending: "Ожидает",
};

const PAGE_SIZE = 5;

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function HistoryModal({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const _t = new Date();
  const today =
    _t.getFullYear() +
    "-" +
    String(_t.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(_t.getDate()).padStart(2, "0");

  const visits = useMemo(
    () =>
      MOCK_VISITS.filter(
        (v) =>
          v.clientId === client.id && v.status !== "pending" && v.date <= today,
      ).sort((a, b) => b.date.localeCompare(a.date)),
    [client.id],
  );

  const totalPages = Math.max(1, Math.ceil(visits.length / PAGE_SIZE));
  const slice = visits.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const rows: (Visit | null)[] = [...slice];
  while (rows.length < PAGE_SIZE) rows.push(null);

  const count = visits.length;
  const countLabel = count === 1 ? "визит" : count < 5 ? "визита" : "визитов";

  return (
    <>
      <div className="staff-overlay" onClick={onClose} />
      <div className="staff-modal" style={{ width: 450 }}>
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
          {count === 0 ? (
            <div className="history-empty">Нет посещений</div>
          ) : (
            rows.map((v, i) =>
              v ? (
                <div key={i} className="history-item">
                  <span className="history-item__date">
                    {formatDate(v.date)}
                  </span>
                  <span className="history-item__status">
                    {STATUS_LABELS[v.status] ?? ""}
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

// ── Страница ──────────────────────────────────────────────────

export default function ClientsPage() {
  const { clients, updateNotes } = useStaffContext();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<Client | null>(null);
  const [notesClient, setNotesClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? clients.filter(
          (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
        )
      : clients;
  }, [clients, query]);

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
    </div>
  );
}
