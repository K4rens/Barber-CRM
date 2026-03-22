// src/staff/pages/ServicesPage.tsx

import { useState } from "react";
import "../../staff-styles/services.css";

interface Service {
  id: number;
  name: string;
  duration: number; // минуты
  price: number;
  active: boolean;
}

const DURATION_OPTIONS = [
  { value: 15, label: "15 мин" },
  { value: 30, label: "30 мин" },
  { value: 45, label: "45 мин" },
  { value: 60, label: "1 ч" },
  { value: 75, label: "1 ч 15 мин" },
  { value: 90, label: "1 ч 30 мин" },
  { value: 120, label: "2 ч" },
];

function formatDuration(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

const INITIAL_SERVICES: Service[] = [
  { id: 1, name: "Стрижка", duration: 45, price: 1200, active: true },
  { id: 2, name: "Борода", duration: 30, price: 800, active: true },
  { id: 3, name: "Стрижка + борода", duration: 60, price: 1800, active: true },
  { id: 4, name: "Fade", duration: 60, price: 1500, active: false },
];

// ── Модалка ──────────────────────────────────────────────────

interface ModalProps {
  service: Service | null; // null = новая
  onSave: (s: Omit<Service, "id">) => void;
  onClose: () => void;
}

function ServiceModal({ service, onSave, onClose }: ModalProps) {
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState(service?.price ?? "");
  const [duration, setDuration] = useState(service?.duration ?? 45);
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      setError("Введите название");
      return;
    }
    const p = Number(price);
    if (!p || p <= 0) {
      setError("Введите корректную цену");
      return;
    }
    onSave({ name: name.trim(), price: p, duration, active });
    onClose();
  };

  return (
    <>
      <div className="staff-overlay" onClick={onClose} />
      <div className="staff-modal" style={{ width: 380 }}>
        <div className="staff-modal__header">
          <span className="staff-modal__title">
            {service ? "Изменить услугу" : "Новая услуга"}
          </span>
          <button className="staff-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="nb-form">
          <div className="nb-field">
            <label className="nb-field__label">Название</label>
            <input
              className="nb-field__input"
              type="text"
              placeholder="Стрижка"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="nb-row">
            <div className="nb-field">
              <label className="nb-field__label">Цена, ₽</label>
              <input
                className="nb-field__input"
                type="number"
                placeholder="1200"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="nb-field">
              <label className="nb-field__label">Длительность</label>
              <select
                className="nb-field__input"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="nb-field">
            <label className="nb-field__label">Статус</label>
            <div
              className="toggle-row"
              onClick={() => setActive((v) => !v)}
              style={{ cursor: "pointer" }}
            >
              <span className="toggle-row__label">
                {active ? "Активна" : "Неактивна"}
              </span>
              <div
                className={`toggle-btn ${active ? "toggle-btn--on" : "toggle-btn--off"}`}
              />
            </div>
          </div>
          {error && <div className="nb-error">{error}</div>}
          <button className="staff-btn staff-btn--primary" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </>
  );
}

// ── Страница ─────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [nextId, setNextId] = useState(5);
  const [editing, setEditing] = useState<Service | null | undefined>(undefined); // undefined = закрыта

  const handleSave = (data: Omit<Service, "id">) => {
    if (editing) {
      setServices((prev) =>
        prev.map((s) => (s.id === editing.id ? { ...s, ...data } : s)),
      );
    } else {
      setServices((prev) => [...prev, { id: nextId, ...data }]);
      setNextId((n) => n + 1);
    }
  };

  const handleDelete = (id: number) =>
    setServices((prev) => prev.filter((s) => s.id !== id));

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <p className="staff-page-header__sub">Управление</p>
          <h1 className="staff-page-header__title">Услуги</h1>
        </div>
        <button className="add-btn" onClick={() => setEditing(null)}>
          + Добавить
        </button>
      </div>

      <div className="service-table">
        <div className="service-row service-row--head">
          <span>Название</span>
          <span>Длительность</span>
          <span>Цена</span>
          <span>Статус</span>
          <span />
        </div>
        {services.map((s) => (
          <div
            key={s.id}
            className={`service-row${s.active ? "" : " service-row--inactive"}`}
          >
            <span className="service-row__name">{s.name}</span>
            <span className="service-row__meta">
              {formatDuration(s.duration)}
            </span>
            <span className="service-row__price">
              {s.price.toLocaleString("ru-RU")} ₽
            </span>
            <span className={`tag${s.active ? " tag--active" : ""}`}>
              {s.active ? "Активна" : "Неактивна"}
            </span>
            <div className="service-row__actions">
              <button className="row-btn" onClick={() => setEditing(s)}>
                Изменить
              </button>
              <button
                className="row-btn row-btn--danger"
                onClick={() => handleDelete(s.id)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing !== undefined && (
        <ServiceModal
          service={editing}
          onSave={handleSave}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
