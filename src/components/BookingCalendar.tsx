import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { useFreeSlots } from "../hooks/useBookingFlow";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];


const navBtn: CSSProperties = {
  background: "none",
  border: "1.5px solid #000",
  borderRadius: 6,
  width: 24,
  height: 24,
  cursor: "pointer",
  fontSize: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#000",
  flexShrink: 0,
  outline: "none",
};


function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}


interface Props {
  barberId: string | null;
  serviceId: string | null;
  selectedDate: Date | null;
  selectedTime: string | null; 
  onSelectDate: (d: Date) => void;
  onSelectTime: (isoTime: string) => void;
}


export default function BookingCalendar({
  barberId,
  serviceId,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const dateParam = selectedDate ? toDateString(selectedDate) : undefined;
  const {
    data: slotsData,
    isLoading: slotsLoading,
    isError: slotsError,
  } = useFreeSlots(barberId, dateParam, serviceId ?? undefined);


  const cells = useMemo(() => {
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [year, month]);

  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const isPast = (d: number) =>
    new Date(year, month, d) <
    new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isSelected = (d: number) =>
    selectedDate?.getFullYear() === year &&
    selectedDate?.getMonth() === month &&
    selectedDate?.getDate() === d;
  const isToday = (d: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === d;

  const freeSlots = useMemo(
    () => slotsData?.slots.filter((s) => s.status === "free") ?? [],
    [slotsData],
  );

  return (
    <div style={{ padding: "14px 18px", fontFamily: "Manrope, sans-serif" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <button onClick={prev} style={navBtn}>
          &#x276E;
        </button>
        <span
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.04em" }}
        >
          {MONTHS[month]} {year}
        </span>
        <button onClick={next} style={navBtn}>
          &#x276F;
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              padding: "4px 0",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.06em",
              color: "#bbb",
              textTransform: "uppercase",
            }}
          >
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          const past = day ? isPast(day) : false;
          const sel = day ? isSelected(day) : false;
          const tod = day ? isToday(day) : false;

          return (
            <div
              key={i}
              onClick={() =>
                day && !past && onSelectDate(new Date(year, month, day))
              }
              className={`cal-day ${day && !past && !sel ? "cal-day--hoverable" : ""}`}
              style={{
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 400,
                borderRadius: 6,
                cursor: day && !past ? "pointer" : "default",
                color: !day
                  ? "transparent"
                  : past
                    ? "#ccc"
                    : sel
                      ? "#fff"
                      : "#000",
                background: sel ? "#000" : "transparent",
                border:
                  tod && !sel ? "1.5px solid #000" : "1.5px solid transparent",
                transition: "all 0.15s ease",
                userSelect: "none",
              }}
            >
              {day ?? ""}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div
          style={{
            marginTop: 12,
            borderTop: "1.5px solid #000",
            paddingTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#bbb",
              marginBottom: 8,
            }}
          >
            Выберите время
          </div>

          {slotsLoading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 5,
              }}
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "6px 0",
                    height: 30,
                    borderRadius: 6,
                    background: "#f0f0f0",
                    animation: "pulse 1.2s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          )}

          {slotsError && (
            <div style={{ fontSize: 12, color: "#c00", padding: "8px 0" }}>
              Не удалось загрузить слоты. Попробуйте другую дату.
            </div>
          )}

          {!slotsLoading && !slotsError && freeSlots.length === 0 && (
            <div style={{ fontSize: 12, color: "#999", padding: "8px 0" }}>
              На этот день нет свободных слотов
            </div>
          )}

          {!slotsLoading && !slotsError && freeSlots.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 5,
              }}
            >
              {freeSlots.map((slot) => {
                const label = new Date(slot.time_start).toLocaleTimeString(
                  "ru-RU",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  },
                );
                const active = selectedTime === slot.time_start;

                return (
                  <button
                    key={slot.time_start}
                    onClick={() => onSelectTime(slot.time_start)}
                    style={{
                      padding: "6px 0",
                      border: "1.5px solid #000",
                      borderRadius: 6,
                      background: active ? "#000" : "#fff",
                      color: active ? "#fff" : "#000",
                      fontSize: 11,
                      fontWeight: 500,
                      fontFamily: "Manrope, sans-serif",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      letterSpacing: "0.02em",
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background =
                          "#000";
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background =
                          "#fff";
                        (e.currentTarget as HTMLElement).style.color = "#000";
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
