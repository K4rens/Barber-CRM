import { useMemo } from "react";
import type { Booking } from "../../types/bookings";
import {
  DAYS_SHORT,
  MONTHS,
  MONTHS_NOM,
  STATUS_CLASS,
  getWeekStart,
  shortName,
} from "../../types/bookings";
import type { ScheduleState } from "../../layout/StaffLayout";

interface Props {
  weekOffset: number;
  bookings: Booking[];
  schedule: ScheduleState;
  onDayClick: (dayIndex: number) => void;
  onBookingClick: (booking: Booking) => void;
}

// Хелпер для проверки, прошёл ли день
function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export default function WeekView({
  weekOffset,
  bookings,
  schedule,
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

        <div className="week-calendar__head">
          {days.map((d, i) => {
            const isToday = d.getTime() === today.getTime();
            const isPast = isPastDate(d);
            const weekScheduleForDay = schedule[weekOffset] ?? {};
            const shift = weekScheduleForDay[i];
            const hasBookings = dayBookings(days[i]).length > 0;
            const isOff =
              !isPast &&
              (shift === null || (shift === undefined && !hasBookings));
            return (
              <div
                key={i}
                className={`week-day-head${isToday ? " week-day-head--today" : ""}${isPast ? " week-day-head--past" : ""}${isOff ? " week-day-head--off" : ""}`}
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


        <div className="week-calendar__body">
          {days.map((_, i) => {
            const isToday = days[i].getTime() === today.getTime();
            const isPast = isPastDate(days[i]);
            const weekScheduleForDay = schedule[weekOffset] ?? {};
            const shift = weekScheduleForDay[i];
            const hasBookings = dayBookings(days[i]).length > 0;
            const isOff =
              !isPast &&
              (shift === null || (shift === undefined && !hasBookings));
            const bList = dayBookings(days[i]);
            return (
              <div
                key={i}
                className={`day-col${isToday ? " day-col--today" : ""}${isPast ? " day-col--past" : ""}${isOff ? " day-col--off" : ""}`}
              >
                {isPast ? (
                  <div className="day-col__past-label">Прошедший день</div>
                ) : isOff ? (
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
                      </span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "none" }} id="week-label-data">
        {weekLabel}
      </div>
    </div>
  );
}
