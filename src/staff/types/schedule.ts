// src/staff/types/schedule.ts

export interface Shift {
  start: string; // 'HH:00'
  end: string; // 'HH:00'
}

// scheduleState[weekOffset][dayIndex] → Shift | null
export type WeekSchedule = Record<number, Shift | null>;
export type ScheduleState = Record<number, WeekSchedule>;

export interface Template {
  id: number;
  days: (Shift | null)[]; // 7 элементов, 0=Пн
}

export const DAYS_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
export const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const START_OPTIONS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
];
export const END_OPTIONS = [
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
];

export const DEFAULT_SCHEDULE: ScheduleState = {
  0: {
    0: { start: "09:00", end: "20:00" },
    1: { start: "09:00", end: "20:00" },
    2: { start: "09:00", end: "20:00" },
    3: { start: "10:00", end: "18:00" },
    4: { start: "09:00", end: "20:00" },
    5: { start: "10:00", end: "16:00" },
    6: null,
  },
};

export function getWeekSchedule(
  state: ScheduleState,
  offset: number,
): WeekSchedule {
  return state[offset] ?? {};
}
