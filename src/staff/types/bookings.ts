// src/staff/types/bookings.ts

export type BookingStatus = "pending" | "completed" | "cancelled" | "no_show";

export interface Booking {
  id: number;
  dayOffset: number; // 0=Пн … 6=Вс
  name: string;
  phone: string;
  service: string;
  start: string; // 'HH:MM'
  end: string; // 'HH:MM'
  duration?: number;
  status: BookingStatus;
  date?: string; // 'YYYY-MM-DD'
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

export const PRICE_MAP: Record<string, string> = {
  Стрижка: "1 200 ₽",
  Борода: "800 ₽",
  "Стрижка + борода": "1 800 ₽",
  Fade: "1 500 ₽",
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

/** ISO-дата: начало недели + weekOffset недель + dayIndex дней */
function wd(weekOffset: number, dayIndex: number): string {
  const ws = getWeekStart(weekOffset);
  ws.setDate(ws.getDate() + dayIndex);
  return (
    ws.getFullYear() +
    "-" +
    String(ws.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(ws.getDate()).padStart(2, "0")
  );
}

export const MOCK_BOOKINGS: Booking[] = [
  // ── Текущая неделя ────────────────────────────────────────
  {
    id: 1,
    dayOffset: 0,
    name: "Алексей Смирнов",
    phone: "+7 916 123-45-67",
    service: "Стрижка",
    start: "10:00",
    end: "10:45",
    duration: 45,
    date: wd(0, 0),
    status: "completed",
  },
  {
    id: 2,
    dayOffset: 0,
    name: "Дмитрий Козлов",
    phone: "+7 903 987-65-43",
    service: "Борода",
    start: "12:30",
    end: "13:00",
    duration: 30,
    date: wd(0, 0),
    status: "completed",
  },
  {
    id: 3,
    dayOffset: 0,
    name: "Игорь Петров",
    phone: "+7 925 111-22-33",
    service: "Стрижка + борода",
    start: "14:00",
    end: "15:00",
    duration: 60,
    date: wd(0, 0),
    status: "no_show",
  },
  {
    id: 4,
    dayOffset: 1,
    name: "Сергей Новиков",
    phone: "+7 916 444-55-66",
    service: "Fade",
    start: "11:00",
    end: "12:00",
    duration: 60,
    date: wd(0, 1),
    status: "completed",
  },
  {
    id: 5,
    dayOffset: 1,
    name: "Михаил Зайцев",
    phone: "+7 903 777-88-99",
    service: "Стрижка",
    start: "14:00",
    end: "14:45",
    duration: 45,
    date: wd(0, 1),
    status: "cancelled",
  },
  {
    id: 6,
    dayOffset: 2,
    name: "Иван Морозов",
    phone: "+7 925 321-54-76",
    service: "Стрижка",
    start: "10:00",
    end: "10:45",
    duration: 45,
    date: wd(0, 2),
    status: "completed",
  },
  {
    id: 7,
    dayOffset: 2,
    name: "Антон Лебедев",
    phone: "+7 916 654-32-10",
    service: "Fade",
    start: "13:00",
    end: "14:00",
    duration: 60,
    date: wd(0, 2),
    status: "completed",
  },
  {
    id: 8,
    dayOffset: 3,
    name: "Павел Волков",
    phone: "+7 925 555-66-77",
    service: "Стрижка",
    start: "11:30",
    end: "12:15",
    duration: 45,
    date: wd(0, 3),
    status: "completed",
  },
  {
    id: 9,
    dayOffset: 3,
    name: "Роман Соколов",
    phone: "+7 903 222-33-44",
    service: "Борода",
    start: "14:00",
    end: "14:30",
    duration: 30,
    date: wd(0, 3),
    status: "completed",
  },
  {
    id: 10,
    dayOffset: 4,
    name: "Никита Фёдоров",
    phone: "+7 916 888-99-00",
    service: "Стрижка + борода",
    start: "10:00",
    end: "11:00",
    duration: 60,
    date: wd(0, 4),
    status: "pending",
  },
  {
    id: 11,
    dayOffset: 4,
    name: "Андрей Попов",
    phone: "+7 903 111-00-99",
    service: "Стрижка",
    start: "12:00",
    end: "12:45",
    duration: 45,
    date: wd(0, 4),
    status: "pending",
  },
  {
    id: 12,
    dayOffset: 4,
    name: "Вадим Орлов",
    phone: "+7 925 444-55-66",
    service: "Fade",
    start: "14:00",
    end: "15:00",
    duration: 60,
    date: wd(0, 4),
    status: "pending",
  },
  // ── Следующая неделя ──────────────────────────────────────
  {
    id: 13,
    dayOffset: 0,
    name: "Кирилл Баранов",
    phone: "+7 916 777-66-55",
    service: "Стрижка",
    start: "10:00",
    end: "10:45",
    duration: 45,
    date: wd(1, 0),
    status: "pending",
  },
  {
    id: 14,
    dayOffset: 0,
    name: "Евгений Тихонов",
    phone: "+7 903 333-44-55",
    service: "Стрижка + борода",
    start: "12:00",
    end: "13:00",
    duration: 60,
    date: wd(1, 0),
    status: "pending",
  },
  {
    id: 15,
    dayOffset: 1,
    name: "Алексей Смирнов",
    phone: "+7 916 123-45-67",
    service: "Борода",
    start: "11:00",
    end: "11:30",
    duration: 30,
    date: wd(1, 1),
    status: "pending",
  },
  {
    id: 16,
    dayOffset: 2,
    name: "Дмитрий Козлов",
    phone: "+7 903 987-65-43",
    service: "Fade",
    start: "10:00",
    end: "11:00",
    duration: 60,
    date: wd(1, 2),
    status: "pending",
  },
  {
    id: 17,
    dayOffset: 2,
    name: "Иван Морозов",
    phone: "+7 925 321-54-76",
    service: "Стрижка",
    start: "13:30",
    end: "14:15",
    duration: 45,
    date: wd(1, 2),
    status: "pending",
  },
  {
    id: 18,
    dayOffset: 3,
    name: "Михаил Зайцев",
    phone: "+7 903 777-88-99",
    service: "Стрижка + борода",
    start: "10:00",
    end: "11:00",
    duration: 60,
    date: wd(1, 3),
    status: "pending",
  },
  {
    id: 19,
    dayOffset: 4,
    name: "Павел Волков",
    phone: "+7 925 555-66-77",
    service: "Стрижка",
    start: "11:00",
    end: "11:45",
    duration: 45,
    date: wd(1, 4),
    status: "pending",
  },
  {
    id: 20,
    dayOffset: 4,
    name: "Сергей Новиков",
    phone: "+7 916 444-55-66",
    service: "Fade",
    start: "14:30",
    end: "15:30",
    duration: 60,
    date: wd(1, 4),
    status: "pending",
  },
];
