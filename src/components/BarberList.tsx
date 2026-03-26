import "./BarberList.css";
import { useBarbers } from "../hooks/useBookingFlow";
import type { Barber } from "../api/types";

interface BarberListProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

function BarberSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="barber-item barber-item--skeleton">
          <div className="barber-avatar skeleton-box" />
          <div className="barber-info">
            <span
              className="barber-name skeleton-box"
              style={{ width: "120px", height: "13px", display: "block" }}
            />
            <span
              className="barber-specialty skeleton-box"
              style={{
                width: "80px",
                height: "11px",
                display: "block",
                marginTop: 4,
              }}
            />
          </div>
        </li>
      ))}
    </>
  );
}


export default function BarberList({ selected, onSelect }: BarberListProps) {
  const { data: barbers, isLoading, isError, error } = useBarbers();
  
  if (isLoading) {
    return (
      <ul className="barber-list">
        <BarberSkeleton />
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="barber-list-error">
        <span>Не удалось загрузить барберов</span>
        {error instanceof Error && (
          <span className="barber-list-error__detail">{error.message}</span>
        )}
      </div>
    );
  }

  if (!barbers?.length) {
    return (
      <div className="barber-list-error">
        <span>Барберы не найдены</span>
      </div>
    );
  }


  return (
    <ul className="barber-list">
      {barbers.map((b: Barber) => {
        const initials = b.name
          .split(" ")
          .map((n) => n[0])
          .join("");

        const specialty =
          b.services
            .filter((s) => s.is_active)
            .slice(0, 3)
            .map((s) => s.name)
            .join(", ") || "Все виды стрижек";

        return (
          <li
            key={b.barber_id}
            className={`barber-item ${selected === b.barber_id ? "barber-item--selected" : ""}`}
            onClick={() => onSelect(b.barber_id)}
          >
            <div className="barber-avatar">{initials}</div>
            <div className="barber-info">
              <span className="barber-name">{b.name}</span>
              <span className="barber-specialty">{specialty}</span>
            </div>
            {selected === b.barber_id && (
              <span className="barber-check">✓</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
