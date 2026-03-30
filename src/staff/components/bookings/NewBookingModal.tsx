import { useState, useEffect } from "react";
import type { Booking } from "../../types/bookings";
import { useStaffContext } from "../../layout/StaffLayout";

const TIME_SLOTS: string[] = [];
for (let h = 8; h < 21; h++) {
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

function toLocalIso(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

interface Props {
  presetTime?: string;
  presetDate?: string;
  freeSlots?: number;
  onClose: () => void;
  onSave: (booking: Omit<Booking, "id">) => void;
}

export default function NewBookingModal({
  presetTime,
  presetDate,
  freeSlots,
  onClose,
  onSave,
}: Props) {
  const { services } = useStaffContext();
  const activeServices = services.filter((s) => s.active);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(presetDate ?? toLocalIso(new Date()));
  const [time, setTime] = useState(presetTime ?? "");
  const [service, setService] = useState("");
  const [error, setError] = useState("");

  const maxDurMinutes = freeSlots ? freeSlots * 15 : 999;
  const selectedService = activeServices.find((s) => s.name === service);
  const duration = selectedService?.duration ?? null;
  const timeFixed = !!presetTime;

  useEffect(() => {
    if (presetTime) setTime(presetTime);
  }, [presetTime]);
  useEffect(() => {
    if (presetDate) setDate(presetDate);
  }, [presetDate]);

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

    const dur = duration ?? 45;
    const [th, tm] = time.split(":").map(Number);
    const endTotal = th * 60 + tm + dur;
    const endStr =
      String(Math.floor(endTotal / 60)).padStart(2, "0") +
      ":" +
      String(endTotal % 60).padStart(2, "0");

    const [y, mo, day] = date.split("-").map(Number);
    const d = new Date(y, mo - 1, day);
    const dayOffset = d.getDay() === 0 ? 6 : d.getDay() - 1;

    onSave({
      dayOffset,
      name: name.trim(),
      phone,
      service,
      serviceId: selectedService?.id,
      start: time,
      end: endStr,
      duration: dur,
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

          <div className="nb-row">
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
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="">— выбрать —</option>
                  {activeServices.map((s) => (
                    <option
                      key={s.id}
                      value={s.name}
                      disabled={s.duration > maxDurMinutes}
                    >
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
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
