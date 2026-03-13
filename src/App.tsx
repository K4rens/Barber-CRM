// ─────────────────────────────────────────────────────────────
// App.tsx — основной компонент с реальным booking-flow
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import "./App.css";

import AccordionPanel from "./components/AccordionPanel";
import BarberList from "./components/BarberList";
import ServiceList from "./components/ServiceList";
import BookingCalendar from "./components/BookingCalendar";

import {
  useCreateBooking,
  getBookingErrorMessage,
} from "./hooks/useBookingFlow";
import { ApiException } from "./api/client";


// ── Форматирование телефона ───────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  const local = digits.startsWith('7') || digits.startsWith('8')
    ? digits.slice(1)
    : digits;

  let result = '+7';
  if (local.length === 0) return result;

  result += ' ' + local.slice(0, 3);
  if (local.length >= 4) result += ' ' + local.slice(3, 6);
  if (local.length >= 7) result += '-' + local.slice(6, 8);
  if (local.length >= 9) result += '-' + local.slice(8, 10);

  return result;
}

// ── Типы ─────────────────────────────────────────────────────

interface BookingForm {
  barberId: string | null;
  serviceId: string | null;
  date: Date | null;
  time: string | null;
  clientName: string;
  clientPhone: string;
}

const INITIAL_FORM: BookingForm = {
  barberId: null,
  serviceId: null,
  date: null,
  time: null,
  clientName: "",
  clientPhone: "",
};

type Panel = 1 | 2 | 3 | 4;

// ── Компонент ─────────────────────────────────────────────────

export default function App() {
  const [form, setForm] = useState<BookingForm>(INITIAL_FORM);
  const [openPanel, setOpenPanel] = useState<Panel | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const canBook =
    !!form.barberId &&
    !!form.serviceId &&
    !!form.date &&
    !!form.time &&
    form.clientName.trim().length > 0 &&
    form.clientPhone.trim().length > 0;

  const { mutate: createBooking, isPending } = useCreateBooking(
    () => {
      setBookingSuccess(true);
      setForm(INITIAL_FORM);
      setOpenPanel(null);
    },
    (error: ApiException) => {
      setBookingError(getBookingErrorMessage(error));
    },
  );

  const handleBook = () => {
    if (!canBook) return;
    setBookingError(null);
    createBooking({
      barber_id: form.barberId!,
      service_id: form.serviceId!,
      client_name: form.clientName.trim(),
      client_phone: form.clientPhone.trim(),
      time_start: form.time!,
    });
  };

  const toggle = (panel: Panel) =>
    setOpenPanel((prev) => (prev === panel ? null : panel));

  if (bookingSuccess) {
    return (
      <main className="page-main">
        <div className="panels" style={{ gap: 16, alignItems: "flex-start" }}>
          <h2 style={{ fontFamily: "Manrope, sans-serif", fontSize: 18, fontWeight: 500 }}>
            Запись подтверждена ✓
          </h2>
          <p style={{ fontFamily: "Manrope, sans-serif", fontSize: 13, color: "#555" }}>
            Мы ждём вас. Если планы изменятся — пожалуйста, отмените запись заранее.
          </p>
          <button
            className="book-btn book-btn--active"
            onClick={() => setBookingSuccess(false)}
          >
            Записаться ещё раз
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-main">
      <div className="panels">

        {/* ── 1. Выбор барбера ── */}
        <AccordionPanel
          number={1}
          title="Выбрать барбера"
          isOpen={openPanel === 1}
          onToggle={() => toggle(1)}
        >
          <BarberList
            selected={form.barberId}
            onSelect={(id) => {
              setForm((f) => ({
                ...f,
                barberId: id,
                serviceId: null,
                date: null,
                time: null,
              }));
            }}
          />
        </AccordionPanel>

        {/* ── 2. Выбор услуги ── */}
        <AccordionPanel
          number={2}
          title="Выбрать услугу"
          isOpen={openPanel === 2}
          disabled={!form.barberId}
          onToggle={() => toggle(2)}
        >
          <ServiceList
            barberId={form.barberId}
            selected={form.serviceId}
            onSelect={(id) => {
              setForm((f) => ({ ...f, serviceId: id, date: null, time: null }));
            }}
          />
        </AccordionPanel>

        {/* ── 3. Выбор даты и времени ── */}
        <AccordionPanel
          number={3}
          title="Дата и время"
          isOpen={openPanel === 3}
          disabled={!form.serviceId}
          onToggle={() => toggle(3)}
        >
          <BookingCalendar
            barberId={form.barberId}
            serviceId={form.serviceId}
            selectedDate={form.date}
            selectedTime={form.time}
            onSelectDate={(d) => setForm((f) => ({ ...f, date: d, time: null }))}
            onSelectTime={(t) => {
              setForm((f) => ({ ...f, time: t }));
            }}
          />
        </AccordionPanel>

        {/* ── 4. Контактные данные ── */}
        <AccordionPanel
          number={4}
          title="Ваши данные"
          isOpen={openPanel === 4}
          disabled={!form.time}
          onToggle={() => toggle(4)}
        >
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="text"
              placeholder="Ваше имя"
              value={form.clientName}
              onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              style={inputStyle}
            />
            <input
              type="tel"
              placeholder="+7 ___ ___-__-__"
              value={form.clientPhone}
              onChange={(e) => {
                setForm((f) => ({ ...f, clientPhone: formatPhone(e.target.value) }));
              }}
              onFocus={() => {
                if (!form.clientPhone) {
                  setForm((f) => ({ ...f, clientPhone: '+7' }));
                }
              }}
              style={inputStyle}
            />
          </div>
        </AccordionPanel>

      </div>

      {/* ── Сообщение об ошибке ── */}
      {bookingError && (
        <div style={{
          position: "fixed",
          bottom: 80,
          right: 36,
          background: "#fff",
          border: "1.5px solid #c00",
          borderRadius: 8,
          padding: "10px 16px",
          fontFamily: "Manrope, sans-serif",
          fontSize: 12,
          color: "#c00",
          maxWidth: 280,
        }}>
          {bookingError}
        </div>
      )}

      {/* ── Кнопка записи ── */}
      <button
        className={`book-btn ${canBook ? "book-btn--active" : ""}`}
        onClick={handleBook}
        disabled={!canBook || isPending}
      >
        {isPending ? "Запись..." : "Записаться"}
      </button>
    </main>
  );
}

// ── Стиль инпутов ────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'white',
  color: 'black',
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #ddd",
  borderRadius: 8,
  fontFamily: "Manrope, sans-serif",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};