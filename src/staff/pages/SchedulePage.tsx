import { useState, useEffect, useCallback } from "react";
import type { Shift, Template } from "../types/schedule";
import { DAYS_FULL, DAYS_SHORT, getWeekSchedule } from "../types/schedule";
import { getWeekStart, MONTHS, MONTHS_NOM } from "../types/bookings";
import { useStaffContext } from "../layout/StaffLayout";
import { staffApi } from "../../api/endpoints";
import ShiftModal from "../components/schedule/ShiftModal";
import TemplateModal from "../components/schedule/TemplateModal";
import "../../staff-styles/schedule.css";

function toIsoWeek(weekStart: Date): string {
  const d = new Date(weekStart);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3);
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekNum =
    Math.round((d.getTime() - startOfWeek1.getTime()) / 604800000) + 1;
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

function dayIsoFromWeekStart(weekStart: Date, i: number): string {
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + i);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function apiDaysToShifts(
  days: Array<{
    date: string;
    start_time: string;
    end_time: string;
  }>,
  weekStart: Date,
): Record<number, Shift | null> {
  const result: Record<number, Shift | null> = {};
  for (let i = 0; i < 7; i++) {
    const iso = dayIsoFromWeekStart(weekStart, i);
    const found = days.find((d) => d.date === iso);
    result[i] = found
      ? {
          start: found.start_time.slice(0, 5),
          end: found.end_time.slice(0, 5),
        }
      : null;
  }
  return result;
}

export default function SchedulePage() {
  const { schedule, setSchedule, templates, setTemplates, bookings } =
    useStaffContext();

  const [weekOffset, setWeekOffset] = useState(0);
  const [nextId, setNextId] = useState(1);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<
    Template | null | undefined
  >(undefined);
  const [loadingWeeks, setLoadingWeeks] = useState<Set<number>>(new Set());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = getWeekStart(weekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const sm = MONTHS_NOM[weekStart.getMonth()];
  const em = MONTHS_NOM[weekEnd.getMonth()];
  const monthLabel =
    sm === em
      ? `${sm} ${weekStart.getFullYear()}`
      : `${sm} — ${em} ${weekEnd.getFullYear()}`;
  const weekLabel = `${weekStart.getDate()} — ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]}`;

  const weekSchedule = getWeekSchedule(schedule, weekOffset);

  const loadWeek = useCallback(
    async (offset: number) => {
      setLoadingWeeks((prev) => new Set(prev).add(offset));

      const ws = getWeekStart(offset);
      const isoWeek = toIsoWeek(ws);

      try {
        const result = await staffApi.getSchedule(isoWeek);
        const shifts = apiDaysToShifts(result.days, ws);
        setSchedule((prev) => ({ ...prev, [offset]: shifts }));
      } catch (err) {
        console.error("Failed to load schedule", err);
        setSchedule((prev) => ({ ...prev, [offset]: prev[offset] ?? {} }));
      } finally {
        setLoadingWeeks((prev) => {
          const next = new Set(prev);
          next.delete(offset);
          return next;
        });
      }
    },
    [setSchedule],
  );

  useEffect(() => {
    loadWeek(weekOffset);
  }, [weekOffset, loadWeek]);

  const dayIso = (i: number) => dayIsoFromWeekStart(weekStart, i);

  const pendingBookingsForDay = (i: number) => {
    const iso = dayIso(i);
    return bookings.filter((b) => b.date === iso && b.status === "pending");
  };

  const allBookingsForDay = (i: number) => {
    const iso = dayIso(i);
    return bookings.filter((b) => b.date === iso);
  };

  const isPast = (i: number): boolean => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d < today;
  };

  const updateShift = async (dayIndex: number, shift: Shift | null) => {
    const date = dayIso(dayIndex);
    if (shift) {
      await staffApi.upsertScheduleDay(date, {
        start_time: shift.start,
        end_time: shift.end,
        part_of_day: parseInt(shift.start) < 12 ? "am" : "pm",
      });
    } else {
      await staffApi.deleteScheduleDay(date);
    }
    await loadWeek(weekOffset);
  };

  const applyTemplate = async (t: Template) => {
    const promises: Promise<unknown>[] = [];
    t.days.forEach((shift, i) => {
      if (pendingBookingsForDay(i).length === 0 && !isPast(i)) {
        const date = dayIso(i);
        if (shift) {
          promises.push(
            staffApi.upsertScheduleDay(date, {
              start_time: shift.start,
              end_time: shift.end,
              part_of_day: parseInt(shift.start) < 12 ? "am" : "pm",
            }),
          );
        } else {
          promises.push(staffApi.deleteScheduleDay(date).catch(() => {}));
        }
      }
    });
    await Promise.all(promises);
    await loadWeek(weekOffset);
  };

  const saveTemplate = (days: (Shift | null)[]) => {
    if (editingTemplate?.id) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? { ...t, days } : t)),
      );
    } else {
      setTemplates((prev) => [...prev, { id: nextId, days }]);
      setNextId((n) => n + 1);
    }
  };

  const deleteTemplate = (id: number) =>
    setTemplates((prev) => prev.filter((t) => t.id !== id));

  const isLoading = loadingWeeks.has(weekOffset);

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <p className="staff-page-header__sub">{monthLabel}</p>
          <h1 className="staff-page-header__title">Расписание</h1>
        </div>
        <div className="week-nav">
          <button
            className="week-nav__btn"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            &#x276E;
          </button>
          <span className="week-nav__label">{weekLabel}</span>
          <button
            className="week-nav__btn"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            &#x276F;
          </button>
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "#bbb",
            fontSize: 13,
          }}
        >
          Загрузка...
        </div>
      ) : (
        <div className="schedule-grid">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const isToday = d.getTime() === today.getTime();
            const rawShift = weekSchedule[i];
            const allCount = allBookingsForDay(i).length;
            const hasAnyBookings = allCount > 0;
            const isActive =
              rawShift !== null && (rawShift !== undefined || hasAnyBookings);
            const shift = rawShift ?? null;
            const past = isPast(i);
            const blocked = past;
            const editDisabled = allCount > 0;

            return (
              <div
                key={i}
                className={`schedule-day${isActive ? " schedule-day--active" : ""}${isToday ? " schedule-day--today" : ""}${blocked ? " schedule-day--blocked" : ""}`}
              >
                <div className="schedule-day__name">
                  {DAYS_FULL[i]} <span>{d.getDate()}</span>
                </div>
                {isActive ? (
                  <>
                    {shift && (
                      <div className="schedule-day__hours">
                        {shift.start} — {shift.end}
                      </div>
                    )}
                    <div className="schedule-day__bookings-note">
                      {allCount > 0
                        ? `${allCount} запис${allCount === 1 ? "ь" : allCount < 5 ? "и" : "ей"}`
                        : "Нет записей"}
                    </div>
                    {!blocked && (
                      <button
                        className="schedule-day__edit"
                        onClick={() => !editDisabled && setEditingDay(i)}
                        disabled={editDisabled}
                      >
                        Изменить
                      </button>
                    )}
                    {past && (
                      <div className="schedule-day__past-note">
                        Прошедший день
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="schedule-day__off">Выходной</div>
                    {!blocked && (
                      <button
                        className="schedule-day__add"
                        onClick={() => setEditingDay(i)}
                      >
                        + Сделать рабочим
                      </button>
                    )}
                    {past && (
                      <div className="schedule-day__past-note">
                        Прошедший день
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="schedule-templates-section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <button
            className="btn btn--outline"
            onClick={() => setShowTemplates((v) => !v)}
          >
            {showTemplates ? "Скрыть шаблоны" : "Мои шаблоны"}
          </button>
          {showTemplates && (
            <button
              className="btn btn--primary"
              onClick={() => setEditingTemplate(null)}
            >
              + Создать шаблон
            </button>
          )}
        </div>
        {showTemplates && (
          <div className="templates-list">
            {templates.length === 0 && (
              <p style={{ fontSize: 13, color: "#aaa" }}>Шаблонов пока нет</p>
            )}
            {templates.map((t) => (
              <div key={t.id} className="template-item">
                <div className="template-days-row">
                  {t.days.map((day, i) => (
                    <div
                      key={i}
                      className={`template-day-cell ${day ? "template-day-cell--active" : "template-day-cell--off"}`}
                    >
                      <div className="template-day-name">{DAYS_SHORT[i]}</div>
                      {day ? (
                        <div className="template-day-time">
                          {day.start} — {day.end}
                        </div>
                      ) : (
                        <div className="template-day-off">Выходной</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="template-actions">
                  <button
                    className="btn btn--use"
                    onClick={() => applyTemplate(t)}
                  >
                    Использовать
                  </button>
                  <button
                    className="btn btn--edit"
                    onClick={() => setEditingTemplate(t)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="btn btn--danger template-btn--right"
                    onClick={() => deleteTemplate(t.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingDay !== null && (
        <ShiftModal
          dayIndex={editingDay}
          current={
            weekSchedule[editingDay] !== undefined
              ? weekSchedule[editingDay]
              : null
          }
          dayBookings={pendingBookingsForDay(editingDay)}
          onSave={(shift) => updateShift(editingDay, shift)}
          onClose={() => setEditingDay(null)}
        />
      )}

      {editingTemplate !== undefined && (
        <TemplateModal
          template={editingTemplate}
          onSave={saveTemplate}
          onClose={() => setEditingTemplate(undefined)}
        />
      )}
    </div>
  );
}
