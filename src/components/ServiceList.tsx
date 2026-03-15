import "./ServiceList.css";
import { useBarberServices } from "../hooks/useBookingFlow";
import type { Service } from "../api/types";

interface ServiceListProps {
  barberId: string | null;
  selected: string | null;
  onSelect: (id: string) => void;
}

function formatPrice(price: number): string {
  return `${price.toLocaleString("ru-RU")} ₽`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

function ServiceSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="service-item">
          <span
            className="service-name skeleton-box"
            style={{ width: "110px", height: "14px", display: "block" }}
          />
          <span
            className="service-price skeleton-box"
            style={{ width: "60px", height: "13px", display: "block" }}
          />
        </li>
      ))}
    </>
  );
}

// Основной компонент 

export default function ServiceList({
  barberId,
  selected,
  onSelect,
}: ServiceListProps) {
  const {
    data: services,
    isLoading,
    isError,
    error,
  } = useBarberServices(barberId);

  if (!barberId) {
    return <div className="service-list-hint">Сначала выберите барбера</div>;
  }

  if (isLoading) {
    return (
      <ul className="service-list">
        <ServiceSkeleton />
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="service-list-error">
        <span>Не удалось загрузить услуги</span>
        {error instanceof Error && (
          <span className="service-list-error__detail">{error.message}</span>
        )}
      </div>
    );
  }

  const active = services?.filter((s: Service) => s.is_active) ?? [];

  if (!active.length) {
    return (
      <div className="service-list-error">
        <span>У барбера нет доступных услуг</span>
      </div>
    );
  }

  return (
    <ul className="service-list">
      {active.map((s: Service) => (
        <li
          key={s.service_id}
          className={`service-item ${selected === s.service_id ? "service-item--selected" : ""}`}
          onClick={() => onSelect(s.service_id)}
        >
          <div className="service-item__left">
            <span className="service-name">{s.name}</span>
            <span className="service-duration">
              {formatDuration(s.duration_minutes)}
            </span>
          </div>
          <span className="service-price">{formatPrice(s.price)}</span>
        </li>
      ))}
    </ul>
  );
}
