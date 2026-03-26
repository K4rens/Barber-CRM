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
import type { ScheduleState } from "../../layout/StaffLayout";

const DAY_START = 8;
const DAY_END = 21;

interface Props {
  dayOffset: number;
  bookings: Booking[];
  schedule: ScheduleState;
  onBookingClick: (b: Booking) => void;
  onAddSlot: (time: string, freeSlots: number, date: string) => void;
}

function padTime(h: number, m: number) {
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

/** Локальная дата без сдвига UTC */
function toLocalIso(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export default function DayView({
  dayOffset,
  bookings,
  schedule,
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

  const targetDateIso = toLocalIso(targetDate);
  const isSunday = targetDate.getDay() === 0;

  // Определяем weekOffset и dayIndex для targetDate
  const todayForSchedule = new Date();
  todayForSchedule.setHours(0, 0, 0, 0);
  const targetDay = targetDate.getDay();
  const diffToMon = targetDay === 0 ? -6 : 1 - targetDay;
  const targetMon = new Date(targetDate);
  targetMon.setDate(targetDate.getDate() + diffToMon);
  const curDay = todayForSchedule.getDay();
  const curMon = new Date(todayForSchedule);
  curMon.setDate(todayForSchedule.getDate() + (curDay === 0 ? -6 : 1 - curDay));
  const targetWeekOffset = Math.round(
    (targetMon.getTime() - curMon.getTime()) / (7 * 86400000),
  );
  const targetDayIndex = targetDay === 0 ? 6 : targetDay - 1;
  const weekSched = schedule[targetWeekOffset] ?? {};
  const dayShift = weekSched[targetDayIndex];

  const label = `${targetDate.getDate()} ${MONTHS[targetDate.getMonth()]}, ${DAYS_FULL[targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1]}`;
  const monthLabel = `${MONTHS_NOM[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

  const slots = useMemo(() => {
    const s: string[] = [];
    for (let h = DAY_START; h < DAY_END; h++) {
      for (let m = 0; m < 60; m += 15) s.push(padTime(h, m));
    }
    s.push(padTime(DAY_END, 0));
    return s;
  }, []);

  const dayBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.date === targetDateIso && b.status !== "cancelled",
      ),
    [bookings, targetDateIso],
  );

  const hasDayBookings = dayBookings.length > 0;
  const isDayOff =
    dayShift === null || (dayShift === undefined && !hasDayBookings);

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

      {isDayOff ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "#bbb",
            fontFamily: "Manrope, sans-serif",
            fontSize: 13,
          }}
        >
          Выходной день
        </div>
      ) : (
        <div className="day-view">
          {slots.map((key, si) => {
            const isLast = si === slots.length - 1;
            const booking = occupied[key];
            const prevBooking = occupied[getPrevKey(key) ?? ""];
            const isFirst = booking && prevBooking?.id !== booking.id;

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
                      const [bh, bm] = booking.start.split(":").map(Number);
                      const slotsCount = Math.min(
                        dur / 15,
                        (DAY_END * 60 - bh * 60 - bm) / 15,
                      );
                      return (
                        <div
                          className={`day-booking-card ${STATUS_CLASS[booking.status] || ""}`}
                          style={{ height: slotsCount * 40 - 5 + "px" }}
                          onClick={() => onBookingClick(booking)}
                        >
                          <span className="day-booking__name">
                            {booking.name.split(" ")[0]}
                            {booking.name.split(" ")[1]
                              ? " " + booking.name.split(" ")[1][0] + "."
                              : ""}
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
                      onClick={() =>
                        onAddSlot(key, getFreeSlots(key), targetDateIso)
                      }
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
