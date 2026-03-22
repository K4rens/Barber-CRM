// src/staff/pages/BookingsPage.tsx

import { useState, useMemo } from "react";
import type { Booking, BookingStatus } from "../types/bookings";
import {
  MOCK_BOOKINGS,
  DAYS_SHORT,
  MONTHS,
  MONTHS_NOM,
  getWeekStart,
} from "../types/bookings";
import WeekView from "../components/bookings/WeekView";
import DayView from "../components/bookings/DayView";
import MonthView from "../components/bookings/MonthView";
import BookingDrawer from "../components/bookings/BookingDrawer";
import NewBookingModal from "../components/bookings/NewBookingModal";
import "../../staff-styles/bookings.css";

type View = "week" | "day" | "month";

// ── Хелпер: лейбл навигации ──────────────────────────────────

function navLabel(
  view: View,
  weekOffset: number,
  dayOffset: number,
  monthOffset: number,
): string {
  if (view === "week") {
    const ws = getWeekStart(weekOffset);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    return `${ws.getDate()} — ${we.getDate()} ${MONTHS[we.getMonth()]}`;
  }
  if (view === "day") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    const dayNames = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
    return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${dayNames[d.getDay()]}`;
  }
  const t = new Date();
  const target = new Date(t.getFullYear(), t.getMonth() + monthOffset, 1);
  return `${MONTHS_NOM[target.getMonth()]} ${target.getFullYear()}`;
}

// ── Хелпер: лейбл шапки ──────────────────────────────────────

function headerMonth(
  view: View,
  weekOffset: number,
  dayOffset: number,
  monthOffset: number,
): string {
  if (view === "week") {
    const ws = getWeekStart(weekOffset);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    return ws.getMonth() === we.getMonth()
      ? `${MONTHS_NOM[ws.getMonth()]} ${ws.getFullYear()}`
      : `${MONTHS_NOM[ws.getMonth()]} — ${MONTHS_NOM[we.getMonth()]} ${we.getFullYear()}`;
  }
  if (view === "day") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
  }
  const t = new Date();
  const target = new Date(t.getFullYear(), t.getMonth() + monthOffset, 1);
  return `${MONTHS_NOM[target.getMonth()]} ${target.getFullYear()}`;
}

// ── Компонент ────────────────────────────────────────────────

export default function BookingsPage() {
  const [view, setView] = useState<View>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [newBookingTime, setNewBookingTime] = useState<string | undefined>(
    undefined,
  );
  const [newBookingFreeSlots, setNewBookingFreeSlots] = useState<
    number | undefined
  >(undefined);
  const [showNewBooking, setShowNewBooking] = useState(false);

  // Навигация
  const navPrev = () => {
    if (view === "week") setWeekOffset((w) => w - 1);
    if (view === "day") setDayOffset((d) => d - 1);
    if (view === "month") setMonthOffset((m) => m - 1);
  };
  const navNext = () => {
    if (view === "week") setWeekOffset((w) => w + 1);
    if (view === "day") setDayOffset((d) => d + 1);
    if (view === "month") setMonthOffset((m) => m + 1);
  };

  // Переход в день из недели или месяца
  const goToDay = (dayIndex: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ws = getWeekStart(weekOffset);
    const target = new Date(ws);
    target.setDate(ws.getDate() + dayIndex);
    setDayOffset(Math.round((target.getTime() - today.getTime()) / 86400000));
    setView("day");
  };

  const goToDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDayOffset(Math.round((date.getTime() - today.getTime()) / 86400000));
    setView("day");
  };

  // Изменение статуса
  const handleStatusChange = (id: number, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b)),
    );
    setActiveBooking((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  const label = navLabel(view, weekOffset, dayOffset, monthOffset);
  const month = headerMonth(view, weekOffset, dayOffset, monthOffset);

  return (
    <div>
      {/* Шапка */}
      <div className="staff-page-header">
        <div>
          <p className="staff-page-header__sub">{month}</p>
          <h1 className="staff-page-header__title">Записи</h1>
        </div>
        <div className="bookings-header-right">
          {/* Навигация */}
          <div className="week-nav">
            <button className="week-nav__btn" onClick={navPrev}>
              &#x276E;
            </button>
            <span className="week-nav__label">{label}</span>
            <button className="week-nav__btn" onClick={navNext}>
              &#x276F;
            </button>
          </div>
          {/* Переключатель вида */}
          <div className="view-tabs">
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                className={`view-tab${view === v ? " view-tab--active" : ""}`}
                onClick={() => setView(v)}
              >
                {v === "day" ? "День" : v === "week" ? "Неделя" : "Месяц"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Контент */}
      {view === "week" && (
        <WeekView
          weekOffset={weekOffset}
          bookings={bookings}
          onDayClick={goToDay}
          onBookingClick={setActiveBooking}
        />
      )}
      {view === "day" && (
        <DayView
          dayOffset={dayOffset}
          weekOffset={weekOffset}
          bookings={bookings}
          onBookingClick={setActiveBooking}
          onAddSlot={(time, freeSlots) => {
            setNewBookingTime(time);
            setNewBookingFreeSlots(freeSlots);
            setShowNewBooking(true);
          }}
        />
      )}
      {view === "month" && (
        <MonthView monthOffset={monthOffset} onDayClick={goToDate} />
      )}

      {/* Дровер с деталями */}
      <BookingDrawer
        booking={activeBooking}
        onClose={() => setActiveBooking(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Модалка новой записи */}
      {showNewBooking && (
        <NewBookingModal
          presetTime={newBookingTime}
          freeSlots={newBookingFreeSlots}
          onClose={() => {
            setShowNewBooking(false);
            setNewBookingTime(undefined);
          }}
          onSave={(booking) => {
            setBookings((prev) => [...prev, { ...booking, id: Date.now() }]);
          }}
        />
      )}
    </div>
  );
}
