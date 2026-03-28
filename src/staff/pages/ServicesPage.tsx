import { useState, useEffect } from "react";
import { useStaffContext } from "../layout/StaffLayout";
import type { Service } from "../layout/StaffLayout";
import { http } from "../../api/client";
import "../../staff-styles/services.css";

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

function apiToService(s: any): Service {
  return {
    id: s.service_id,
    name: s.name,
    duration: s.duration_minutes,
    price: s.price,
    active: s.is_active,
  };
}

interface ModalProps {
  service: Service | null;
  onSave: (s: Omit<Service, "id">) => Promise<void>;
  onClose: () => void;
}

function ServiceModal({ service, onSave, onClose }: ModalProps) {
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState<string | number>(service?.price ?? "");
  const [duration, setDuration] = useState(service?.duration ?? 45);
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Введите название");
      return;
    }
    const p = Number(price);
    if (!p || p <= 0) {
      setError("Введите корректную цену");
      return;
    }
    setLoading(true);
    try {
      await onSave({ name: name.trim(), price: p, duration, active });
      onClose();
    } catch {
      setError("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
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
          <button
            className="staff-btn staff-btn--primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function ServicesPage() {
  const { services, setServices } = useStaffContext();
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http
      .get("/staff/services", { params: { include_inactive: true } })
      .then(({ data }) => {
        setServices(data.services.map(apiToService));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: Omit<Service, "id">) => {
    const body = {
      name: data.name,
      price: data.price,
      duration_minutes: data.duration,
    };
    if (editing) {
      const { data: updated } = await http.put(
        `/staff/services/${editing.id}`,
        {
          ...body,
          is_active: data.active,
        },
      );
      setServices((prev) =>
        prev.map((s) => (s.id === editing.id ? apiToService(updated) : s)),
      );
    } else {
      const { data: created } = await http.post("/staff/services", body);
      setServices((prev) => [...prev, apiToService(created)]);
    }
  };

  const handleDelete = async (id: string) => {
    await http.delete(`/staff/services/${id}`);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading)
    return (
      <div style={{ padding: 40, color: "#aaa", fontSize: 13 }}>
        Загрузка...
      </div>
    );

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
        {services.length === 0 && (
          <div
            style={{
              padding: "20px",
              fontSize: 13,
              color: "#aaa",
              textAlign: "center",
            }}
          >
            Нет услуг
          </div>
        )}
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
