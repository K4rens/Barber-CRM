import { useMemo } from "react";
import { MONTHS_NOM } from "../../types/bookings";

interface Props {
  monthOffset: number;
  onDayClick: (date: Date) => void;
}

const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function MonthView({ monthOffset, onDayClick }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { year, month, cells } = useMemo(() => {
    const t = new Date();
    const target = new Date(t.getFullYear(), t.getMonth() + monthOffset, 1);
    const y = target.getFullYear();
    const m = target.getMonth();
    const firstDay = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const c: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (c.length % 7 !== 0) c.push(null);
    return { year: y, month: m, cells: c };
  }, [monthOffset]);

  return (
    <div className="month-calendar">
      <div className="month-label">
        {MONTHS_NOM[month]} {year}
      </div>
      <div className="month-head">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="month-head__day">
            {d}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((day, i) => {
          const isToday =
            day !== null &&
            new Date(year, month, day).getTime() === today.getTime();
          const isPast = day !== null && new Date(year, month, day) < today;
          const isEmpty = day === null;
          return (
            <div
              key={i}
              className={
                "month-cell" +
                (isToday ? " month-cell--today" : "") +
                (isPast ? " month-cell--past" : "") +
                (isEmpty ? " month-cell--empty" : "")
              }
              onClick={() => {
                if (day) onDayClick(new Date(year, month, day));
              }}
            >
              {day && <span className="month-cell__num">{day}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
