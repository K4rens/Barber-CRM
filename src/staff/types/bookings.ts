export type BookingStatus = "pending" | "completed" | "cancelled" | "no_show";

export interface Booking {
  id: number;
  apiId?: string;
  dayOffset: number;
  name: string;
  phone: string;
  service: string;
  serviceId?: string;
  start: string;
  end: string;
  duration?: number;
  status: BookingStatus;
  date?: string;
  clientId?: number | null;
}

export const STATUS_MAP: Record<BookingStatus, string> = {
  pending: "Ожидает",
  completed: "Завершено",
  cancelled: "Отменено",
  no_show: "Не пришёл",
};

export const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: "",
  completed: "booking-card--completed",
  cancelled: "booking-card--cancelled",
  no_show: "booking-card--no-show",
};

export const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const DAYS_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
export const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
export const MONTHS_NOM = [
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

export function getWeekStart(offset: number): Date {
  const today = new Date();
  const day = today.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

export function shortName(fullName: string): string {
  const parts = fullName.split(" ");
  return parts[0] + (parts[1] ? " " + parts[1][0] + "." : "");
}

export const MOCK_BOOKINGS: Booking[] = [];

