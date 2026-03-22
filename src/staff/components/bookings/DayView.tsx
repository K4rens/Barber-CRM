// src/staff/components/bookings/DayView.tsx

import { useMemo } from "react";
import type { Booking } from "../../types/bookings";
import {
  STATUS_CLASS,
  PRICE_MAP,
  DAYS_FULL,
  MONTHS,
  MONTHS_NOM,
  getWeekStart,
} from "../../types/bookings";

const DAY_START = 8;
const DAY_END = 16;

interface Props {
  dayOffset: number; // смещение от сегодня
  weekOffset: number; // нужен чтобы найти записи по dayOffset в week
  bookings: Booking[];
  onBookingClick: (b: Booking) => void;
  onAddSlot: (time: string, freeSlots: number) => void;
}

function padTime(h: number, m: number) {
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

export default function DayView({
  dayOffset,
  weekOffset,
  bookings,
  onBookingClick,
  onAddSlot,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const targetDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    return d;
  }, [today, dayOffset]);

  const weekDayIndex = (targetDate.getDay() + 6) % 7; // 0=Пн

  const label = `${targetDate.getDate()} ${MONTHS[targetDate.getMonth()]}, ${DAYS_FULL[targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1]}`;
  const monthLabel = `${MONTHS_NOM[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

  // Слоты 15 мин
  const slots = useMemo(() => {
    const s: string[] = [];
    for (let h = DAY_START; h < DAY_END; h++) {
      for (let m = 0; m < 60; m += 15) s.push(padTime(h, m));
    }
    s.push(padTime(DAY_END, 0));
    return s;
  }, []);

  // Занятые слоты
  const dayBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.dayOffset === weekDayIndex && b.status !== "cancelled",
      ),
    [bookings, weekDayIndex],
  );

  const occupied = useMemo(() => {
    const map: Record<string, Booking> = {};
    dayBookings.forEach((b) => {
      const dur = b.duration || 45;
      const [bh, bm] = b.start.split(":").map(Number);
      for (let i = 0; i < dur / 15; i++) {
        const total = bh * 60 + bm + i * 15;
        map[padTime(Math.floor(total / 60), total % 60)] = b;
      }
    });
    return map;
  }, [dayBookings]);

  const getFreeSlots = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    let free = 0;
    for (let i = 0; i < 12; i++) {
      const total = h * 60 + m + i * 15;
      if (total >= DAY_END * 60) break;
      const key = padTime(Math.floor(total / 60), total % 60);
      if (occupied[key]) break;
      free++;
    }
    return free;
  };

  const getPrevKey = (key: string) => {
    const [h, m] = key.split(":").map(Number);
    const total = h * 60 + m - 15;
    if (total < 0) return null;
    return padTime(Math.floor(total / 60), total % 60);
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
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
        {label}
      </div>

      <div className="day-view">
        {slots.map((key, si) => {
          const isLast = si === slots.length - 1;
          const booking = occupied[key];
          const isFirst = booking && !occupied[getPrevKey(key) ?? ""];

          return (
            <div
              key={key}
              className={`day-slot${isLast ? " day-slot--end" : ""}`}
            >
              <div className="day-slot__time">{key}</div>
              <div
                className={`day-slot__cell${booking && !isFirst ? " day-slot__cell--occupied" : ""}`}
              >
                {!isLast &&
                  isFirst &&
                  booking &&
                  (() => {
                    const dur = booking.duration || 45;
                    const slots_count = Math.min(
                      dur / 15,
                      (DAY_END * 60 -
                        parseInt(booking.start.split(":")[0]) * 60 -
                        parseInt(booking.start.split(":")[1])) /
                        15,
                    );
                    return (
                      <div
                        className={`day-booking-card ${STATUS_CLASS[booking.status] || ""}`}
                        style={{ height: slots_count * 40 - 5 + "px" }}
                        onClick={() => onBookingClick(booking)}
                      >
                        <span className="day-booking__name">
                          {booking.name.split(" ")[0]}{" "}
                          {booking.name.split(" ")[1]?.[0]}.
                        </span>
                        <span className="day-booking__service">
                          {booking.service}
                        </span>
                        <span className="day-booking__meta">
                          <span>
                            {booking.start}
                            {booking.end ? ` — ${booking.end}` : ""}
                          </span>
                          <span>{PRICE_MAP[booking.service] || ""}</span>
                        </span>
                      </div>
                    );
                  })()}
                {!isLast && !booking && (
                  <button
                    className="day-slot__add"
                    onClick={() => onAddSlot(key, getFreeSlots(key))}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
