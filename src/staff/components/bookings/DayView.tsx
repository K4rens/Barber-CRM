import { useMemo } from "react";
import type { Booking } from "../../types/bookings";
import {
  STATUS_CLASS,
  DAYS_FULL,
  MONTHS,
  MONTHS_NOM,
} from "../../types/bookings";
import type { ScheduleState } from "../../layout/StaffLayout";

const DEFAULT_DAY_START = 8;
const DEFAULT_DAY_END = 21;

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

  const dayStartTime = useMemo(() => {
    if (dayShift?.start) {
      const [h, m] = dayShift.start.split(":").map(Number);
      return { hour: h, minute: m };
    }
    return { hour: DEFAULT_DAY_START, minute: 0 };
  }, [dayShift]);

  const dayEndTime = useMemo(() => {
    if (dayShift?.end) {
      const [h, m] = dayShift.end.split(":").map(Number);
      return { hour: h, minute: m };
    }
    return { hour: DEFAULT_DAY_END, minute: 0 };
  }, [dayShift]);

  const hasDayBookings = useMemo(
    () =>
      bookings.some(
        (b) => b.date === targetDateIso && b.status !== "cancelled",
      ),
    [bookings, targetDateIso],
  );
  const isDayOff =
    dayShift === null || (dayShift === undefined && !hasDayBookings);

  const dayBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.date === targetDateIso && b.status !== "cancelled",
      ),
    [bookings, targetDateIso],
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

  // Генерация слотов: последний слот заканчивается ровно в end_time
  const slots = useMemo(() => {
    if (isDayOff) return [];

    const startMin = dayStartTime.hour * 60 + dayStartTime.minute;
    const endMin = dayEndTime.hour * 60 + dayEndTime.minute;
    if (endMin <= startMin) return [];

    const slotsList: string[] = [];
    let currentMin = startMin;
    while (currentMin < endMin) {
      slotsList.push(padTime(Math.floor(currentMin / 60), currentMin % 60));
      currentMin += 15;
    }
    // Если последний добавленный слот не заканчивается ровно в endMin,
    // заменяем его на слот, который начинается с округлённого вниз до 15 минут времени
    if (slotsList.length > 0) {
      const lastSlotMin = Math.floor(endMin / 15) * 15;
      if (lastSlotMin > startMin && lastSlotMin + 15 > endMin) {
        // Удаляем последний слот (он был добавлен, но его окончание > endMin)
        slotsList.pop();
        slotsList.push(padTime(Math.floor(lastSlotMin / 60), lastSlotMin % 60));
      }
    }
    return slotsList;
  }, [isDayOff, dayStartTime, dayEndTime]);

  const getFreeSlots = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    let free = 0;
    let currentMin = h * 60 + m;
    const endMin = dayEndTime.hour * 60 + dayEndTime.minute;
    for (let i = 0; i < 12; i++) {
      if (currentMin + i * 15 >= endMin) break;
      const key = padTime(
        Math.floor((currentMin + i * 15) / 60),
        (currentMin + i * 15) % 60,
      );
      if (occupied[key]) break;
      free++;
    }
    return free;
  };

  const isSlotPast = (timeKey: string): boolean => {
    const now = new Date();
    const [hours, minutes] = timeKey.split(":").map(Number);
    const slotDateTime = new Date(targetDate);
    slotDateTime.setHours(hours, minutes, 0, 0);
    return slotDateTime < now;
  };

  const getBookingBlocks = () => {
    if (!slots.length) return [];
    const blocks: { booking: Booking; startIndex: number; endIndex: number }[] =
      [];
    let currentBlock: { booking: Booking; startIndex: number } | null = null;
    for (let i = 0; i < slots.length; i++) {
      const slotKey = slots[i];
      const booking = occupied[slotKey];
      if (booking) {
        if (!currentBlock || currentBlock.booking.id !== booking.id) {
          if (currentBlock) {
            blocks.push({
              booking: currentBlock.booking,
              startIndex: currentBlock.startIndex,
              endIndex: i - 1,
            });
          }
          currentBlock = { booking, startIndex: i };
        }
      } else {
        if (currentBlock) {
          blocks.push({
            booking: currentBlock.booking,
            startIndex: currentBlock.startIndex,
            endIndex: i - 1,
          });
          currentBlock = null;
        }
      }
    }
    if (currentBlock) {
      blocks.push({
        booking: currentBlock.booking,
        startIndex: currentBlock.startIndex,
        endIndex: slots.length - 1,
      });
    }
    return blocks;
  };

  const bookingBlocks = getBookingBlocks();

  if (isDayOff) {
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
      </div>
    );
  }

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
          const block = bookingBlocks.find(
            (b) => si >= b.startIndex && si <= b.endIndex,
          );
          const isFirstInBlock = block && block.startIndex === si;

          return (
            <div
              key={key}
              className={`day-slot${isLast ? " day-slot--end" : ""}`}
            >
              <div className="day-slot__time">{key}</div>
              <div
                className={`day-slot__cell${booking && !isFirstInBlock ? " day-slot__cell--occupied" : ""}`}
              >
                {!isLast && isFirstInBlock && booking && block && (
                  <div
                    className={`day-booking-card ${STATUS_CLASS[booking.status] || ""}`}
                    style={{
                      height:
                        (block.endIndex - block.startIndex + 1) * 40 - 5 + "px",
                    }}
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
                    </span>
                  </div>
                )}
                {!isLast && !booking && (
                  <button
                    className="day-slot__add"
                    disabled={isSlotPast(key)}
                    style={{
                      opacity: isSlotPast(key) ? 0.4 : 1,
                      cursor: isSlotPast(key) ? "not-allowed" : "pointer",
                    }}
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
    </div>
  );
}
