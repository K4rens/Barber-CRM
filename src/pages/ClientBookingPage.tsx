import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../App.css";

import AccordionPanel from "../components/AccordionPanel";
import ServiceList from "../components/ServiceList";
import BookingCalendar from "../components/BookingCalendar";

import {
  useCreateBooking,
  getBookingErrorMessage,
} from "../hooks/useBookingFlow";
import { ApiException } from "../api/client";

function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  let normalized = digits;

  if (normalized.length === 11 && normalized[0] === "8") {
    normalized = "7" + normalized.slice(1);
  }

  if (normalized.length === 11 && normalized[0] === "7") {
    return "+" + normalized;
  }

  return "+" + normalized;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "+7";
  let result = "+7";
  if (digits.length > 1) result += " " + digits.slice(1, 4);
  if (digits.length > 4) result += " " + digits.slice(4, 7);
  if (digits.length > 7) result += "-" + digits.slice(7, 9);
  if (digits.length > 9) result += "-" + digits.slice(9, 11);
  return result;
}

interface BookingForm {
  serviceId: string | null;
  date: Date | null;
  time: string | null;
  clientName: string;
  clientPhone: string;
}

const INITIAL_FORM: BookingForm = {
  serviceId: null,
  date: null,
  time: null,
  clientName: "",
  clientPhone: "",
};

type Panel = 1 | 2 | 3;

export default function ClientBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const barberId = searchParams.get("barber_id");

  const [form, setForm] = useState<BookingForm>(INITIAL_FORM);
  const [openPanel, setOpenPanel] = useState<Panel | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const canBook =
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

  if (!barberId) {
    navigate("/");
    return null;
  }

  const handleBook = () => {
    if (!canBook) return;
    setBookingError(null);
    createBooking({
      barber_id: barberId,
      service_id: form.serviceId!,
      client_name: form.clientName.trim(),
      client_phone: cleanPhone(form.clientPhone), // очищенный телефон
      time_start: form.time!,
    });
  };

  const toggle = (panel: Panel) =>
    setOpenPanel((prev) => (prev === panel ? null : panel));

  if (bookingSuccess) {
    return (
      <main className="page-main">
        <div className="panels" style={{ gap: 16, alignItems: "flex-start" }}>
          <h2
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            Запись подтверждена ✓
          </h2>
          <p
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: 13,
              color: "#555",
            }}
          >
            Мы ждём вас. Если планы изменятся — пожалуйста, отмените запись
            заранее.
          </p>
          <button
            className="book-btn book-btn--active"
            onClick={() => {
              setBookingSuccess(false);
              navigate("/");
            }}
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
        <AccordionPanel
          number={1}
          title="Выбрать услугу"
          isOpen={openPanel === 1}
          onToggle={() => toggle(1)}
        >
          <ServiceList
            barberId={barberId}
            selected={form.serviceId}
            onSelect={(id) => {
              setForm((f) => ({ ...f, serviceId: id, date: null, time: null }));
            }}
          />
        </AccordionPanel>

        <AccordionPanel
          number={2}
          title="Дата и время"
          isOpen={openPanel === 2}
          disabled={!form.serviceId}
          onToggle={() => toggle(2)}
        >
          <BookingCalendar
            barberId={barberId}
            serviceId={form.serviceId}
            selectedDate={form.date}
            selectedTime={form.time}
            onSelectDate={(d) =>
              setForm((f) => ({ ...f, date: d, time: null }))
            }
            onSelectTime={(t) => setForm((f) => ({ ...f, time: t }))}
          />
        </AccordionPanel>

        <AccordionPanel
          number={3}
          title="Ваши данные"
          isOpen={openPanel === 3}
          disabled={!form.time}
          onToggle={() => toggle(3)}
        >
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input
              type="text"
              placeholder="Ваше имя"
              value={form.clientName}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientName: e.target.value }))
              }
              style={inputStyle}
            />
            <input
              type="tel"
              placeholder="+7 999 123-45-67"
              value={form.clientPhone}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  clientPhone: formatPhone(e.target.value),
                }))
              }
              onFocus={() => {
                if (!form.clientPhone)
                  setForm((f) => ({ ...f, clientPhone: "+7" }));
              }}
              style={inputStyle}
            />
          </div>
        </AccordionPanel>
      </div>

      {bookingError && (
        <div
          style={{
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
          }}
        >
          {bookingError}
        </div>
      )}

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

const inputStyle: React.CSSProperties = {
  background: "white",
  color: "black",
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
