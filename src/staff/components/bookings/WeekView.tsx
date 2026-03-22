// src/staff/components/bookings/WeekView.tsx

import { useMemo } from "react";
import type { Booking } from "../../types/bookings";
import {
  DAYS_SHORT,
  MONTHS,
  MONTHS_NOM,
  STATUS_CLASS,
  PRICE_MAP,
  getWeekStart,
  shortName,
} from "../../types/bookings";

interface Props {
  weekOffset: number;
  bookings: Booking[];
  onDayClick: (dayIndex: number) => void;
  onBookingClick: (booking: Booking) => void;
}

export default function WeekView({
  weekOffset,
  bookings,
  onDayClick,
  onBookingClick,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const monthLabel = useMemo(() => {
    const sm = MONTHS_NOM[weekStart.getMonth()];
    const em = MONTHS_NOM[weekEnd.getMonth()];
    return sm === em
      ? `${sm} ${weekStart.getFullYear()}`
      : `${sm} — ${em} ${weekEnd.getFullYear()}`;
  }, [weekStart, weekEnd]);

  const weekLabel = `${weekStart.getDate()} — ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]}`;

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const dayBookings = (dayDate: Date) => {
    const iso =
      dayDate.getFullYear() +
      "-" +
      String(dayDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(dayDate.getDate()).padStart(2, "0");
    return bookings
      .filter((b) => b.date === iso)
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 6,
          fontSize: 11,
          color: "#bbb",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {monthLabel}
      </div>
      <div className="week-calendar">
        {/* Заголовки дней */}
        <div className="week-calendar__head">
          {days.map((d, i) => {
            const isToday = d.getTime() === today.getTime();
            const isOff = i === 6;
            return (
              <div
                key={i}
                className={`week-day-head${isToday ? " week-day-head--today" : ""}${isOff ? " week-day-head--off" : ""}`}
                style={{ cursor: "pointer" }}
                title="Перейти к дню"
                onClick={() => onDayClick(i)}
              >
                <span className="week-day-head__name">{DAYS_SHORT[i]}</span>
                <span className="week-day-head__date">{d.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Тело */}
        <div className="week-calendar__body">
          {days.map((_, i) => {
            const isToday = days[i].getTime() === today.getTime();
            const isOff = i === 6;
            const bList = dayBookings(days[i]);
            return (
              <div
                key={i}
                className={`day-col${isToday ? " day-col--today" : ""}${isOff ? " day-col--off" : ""}`}
              >
                {isOff ? (
                  <div className="day-col__off-label">Выходной</div>
                ) : (
                  bList.map((b) => (
                    <div
                      key={b.id}
                      className={`booking-card ${STATUS_CLASS[b.status] || ""}`}
                      onClick={() => onBookingClick(b)}
                    >
                      <span className="booking-card__name">
                        {shortName(b.name)}
                      </span>
                      <span className="booking-card__service">{b.service}</span>
                      <span className="booking-card__bottom">
                        <span className="booking-card__time">{b.start}</span>
                        {PRICE_MAP[b.service] && (
                          <span className="booking-card__price">
                            {PRICE_MAP[b.service]}
                          </span>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Лейбл недели снизу для навигации */}
      <div style={{ display: "none" }} id="week-label-data">
        {weekLabel}
      </div>
    </div>
  );
}
