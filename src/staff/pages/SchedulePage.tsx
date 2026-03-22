// src/staff/pages/SchedulePage.tsx

import { useState } from "react";
import type { Shift, Template } from "../types/schedule";
import {
  DEFAULT_SCHEDULE,
  DAYS_FULL,
  DAYS_SHORT,
  getWeekSchedule,
} from "../types/schedule";
import { getWeekStart, MONTHS, MONTHS_NOM } from "../types/bookings";
import ShiftModal from "../components/schedule/ShiftModal";
import TemplateModal from "../components/schedule/TemplateModal";
import "../../staff-styles/schedule.css";

interface ScheduleState {
  [weekOffset: number]: { [dayIndex: number]: Shift | null };
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleState>(DEFAULT_SCHEDULE);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [nextId, setNextId] = useState(1);
  const [showTemplates, setShowTemplates] = useState(false);

  // Модалки
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<
    Template | null | undefined
  >(undefined); // undefined = закрыта

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

  const updateShift = (dayIndex: number, shift: Shift | null) => {
    setSchedule((prev) => ({
      ...prev,
      [weekOffset]: { ...(prev[weekOffset] ?? {}), [dayIndex]: shift },
    }));
  };

  const applyTemplate = (t: Template) => {
    const week: { [d: number]: Shift | null } = {};
    t.days.forEach((shift, i) => {
      week[i] = shift;
    });
    setSchedule((prev) => ({ ...prev, [weekOffset]: week }));
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

  return (
    <div>
      {/* Шапка */}
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

      {/* Сетка дней */}
      <div className="schedule-grid">
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          const isToday = d.getTime() === today.getTime();
          const shift = weekSchedule[i] !== undefined ? weekSchedule[i] : null;
          const isActive = shift !== null;

          return (
            <div
              key={i}
              className={`schedule-day${isActive ? " schedule-day--active" : ""}${isToday ? " schedule-day--today" : ""}`}
            >
              <div className="schedule-day__name">
                {DAYS_FULL[i]} <span>{d.getDate()}</span>
              </div>

              {isActive ? (
                <>
                  <div className="schedule-day__hours">
                    {shift!.start} — {shift!.end}
                  </div>
                  <button
                    className="schedule-day__edit"
                    onClick={() => setEditingDay(i)}
                  >
                    Изменить
                  </button>
                </>
              ) : (
                <>
                  <div className="schedule-day__off">Выходной</div>
                  <button
                    className="schedule-day__add"
                    onClick={() => setEditingDay(i)}
                  >
                    + Сделать рабочим
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Шаблоны */}
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

      {/* Модалка смены */}
      {editingDay !== null && (
        <ShiftModal
          dayIndex={editingDay}
          current={
            weekSchedule[editingDay] !== undefined
              ? weekSchedule[editingDay]
              : null
          }
          onSave={(shift) => updateShift(editingDay, shift)}
          onClose={() => setEditingDay(null)}
        />
      )}

      {/* Модалка шаблона */}
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
