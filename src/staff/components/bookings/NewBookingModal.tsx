// src/staff/components/bookings/NewBookingModal.tsx

import { useState, useEffect } from "react";
import type { Booking } from "../../types/bookings";

const SERVICES = [
  { name: "Борода", duration: 30 },
  { name: "Стрижка", duration: 45 },
  { name: "Fade", duration: 60 },
  { name: "Стрижка + борода", duration: 60 },
];

const TIME_SLOTS: string[] = [];
for (let h = 8; h < 16; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(
      String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"),
    );
  }
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const local =
    digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  let result = "+7";
  if (!local.length) return result;
  result += " " + local.slice(0, 3);
  if (local.length >= 4) result += " " + local.slice(3, 6);
  if (local.length >= 7) result += "-" + local.slice(6, 8);
  if (local.length >= 9) result += "-" + local.slice(8, 10);
  return result;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

interface Props {
  presetTime?: string; // время из слота дневного вида
  freeSlots?: number; // сколько слотов свободно подряд
  onClose: () => void;
  onSave: (booking: Omit<Booking, "id">) => void;
}

export default function NewBookingModal({
  presetTime,
  freeSlots,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(presetTime ?? "");
  const [service, setService] = useState("");
  const [error, setError] = useState("");

  const maxDurMinutes = freeSlots ? freeSlots * 15 : 999;
  const selectedService = SERVICES.find((s) => s.name === service);
  const duration = selectedService?.duration ?? null;

  // Если время передано из слота — не даём менять
  const timeFixed = !!presetTime;

  useEffect(() => {
    if (presetTime) setTime(presetTime);
  }, [presetTime]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Введите имя клиента");
      return;
    }
    if (!phone || phone.length < 5) {
      setError("Введите телефон");
      return;
    }
    if (!date) {
      setError("Выберите дату");
      return;
    }
    if (!time) {
      setError("Выберите время");
      return;
    }
    if (!service) {
      setError("Выберите услугу");
      return;
    }

    const [th, tm] = time.split(":").map(Number);
    const endTotal = th * 60 + tm + (duration ?? 45);
    const endStr =
      String(Math.floor(endTotal / 60)).padStart(2, "0") +
      ":" +
      String(endTotal % 60).padStart(2, "0");

    const d = new Date(date);
    const dayOffset = (d.getDay() + 6) % 7; // 0=Пн

    onSave({
      dayOffset,
      name: name.trim(),
      phone,
      service,
      start: time,
      end: endStr,
      duration: duration ?? 45,
      status: "pending",
      date,
    });
    onClose();
  };

  return (
    <>
      <div className="staff-overlay" onClick={onClose} />
      <div className="staff-modal" style={{ width: 380 }}>
        <div className="staff-modal__header">
          <span className="staff-modal__title">Новая запись</span>
          <button className="staff-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="nb-form">
          {/* Имя */}
          <div className="nb-field">
            <label className="nb-field__label">Имя клиента</label>
            <input
              className="nb-field__input"
              type="text"
              placeholder="Алексей"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Телефон */}
          <div className="nb-field">
            <label className="nb-field__label">Телефон</label>
            <input
              className="nb-field__input"
              type="tel"
              placeholder="+7 ___ ___-__-__"
              value={phone}
              onFocus={() => {
                if (!phone) setPhone("+7 ");
              }}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
          </div>

          {/* Дата + Время */}
          <div className="nb-row">
            <div className="nb-field">
              <label className="nb-field__label">Дата</label>
              <input
                className="nb-field__input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="nb-field">
              <label className="nb-field__label">Время</label>
              {timeFixed ? (
                <div className="nb-field__input nb-field__input--readonly">
                  {time}
                </div>
              ) : (
                <select
                  className="nb-field__input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  <option value="">— выбрать —</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Услуга + Длительность */}
          <div className="nb-row">
            <div className="nb-field">
              <label className="nb-field__label">Услуга</label>
              <select
                className="nb-field__input"
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                <option value="">— выбрать —</option>
                {SERVICES.map((s) => (
                  <option
                    key={s.name}
                    value={s.name}
                    disabled={s.duration > maxDurMinutes}
                  >
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="nb-field">
              <label className="nb-field__label">Длительность</label>
              <div className="nb-field__input nb-field__input--readonly">
                {duration ? formatDuration(duration) : "—"}
              </div>
            </div>
          </div>

          {error && <div className="nb-error">{error}</div>}

          <button
            className="staff-btn staff-btn--primary nb-submit"
            onClick={handleSave}
          >
            Добавить запись
          </button>
        </div>
      </div>
    </>
  );
}
