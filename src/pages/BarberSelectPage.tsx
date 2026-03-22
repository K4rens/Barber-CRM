// src/pages/BarberSelectPage.tsx
// Страница выбора барбера — /
// После выбора редирект на /client?barber_id=uuid

import { useNavigate } from "react-router-dom";
import { useBarbers } from "../hooks/useBookingFlow";
import type { Barber } from "../api/types";
import "../components/BarberList.css";
import "./BarberSelectPage.css";

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

export default function BarberSelectPage() {
  const navigate = useNavigate();
  const { data: barbers, isLoading, isError } = useBarbers();

  const handleSelect = (barberId: string) => {
    navigate(`/client?barber_id=${barberId}`);
  };

  return (
    <main className="barber-select-page">
      <div className="barber-select-inner">
        <div className="barber-select-header">
          <p className="barber-select-header__sub">Запись</p>
          <h1 className="barber-select-header__title">Выберите барбера</h1>
        </div>

        <div className="barber-select-list">
          {isLoading && (
            <ul className="barber-list">
              <BarberSkeleton />
            </ul>
          )}

          {isError && (
            <div className="barber-list-error">
              Не удалось загрузить барберов
            </div>
          )}

          {!isLoading && !isError && (
            <ul className="barber-list">
              {barbers?.map((b: Barber) => {
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
                    className="barber-item"
                    onClick={() => handleSelect(b.barber_id)}
                  >
                    <div className="barber-avatar">{initials}</div>
                    <div className="barber-info">
                      <span className="barber-name">{b.name}</span>
                      <span className="barber-specialty">{specialty}</span>
                    </div>
                    <span className="barber-select-arrow">&#x276F;</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
