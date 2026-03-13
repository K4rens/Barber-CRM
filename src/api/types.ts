// ─────────────────────────────────────────────────────────────
// types.ts — сгенерировано из OpenAPI спецификации Barber CRM
// ─────────────────────────────────────────────────────────────

// ── Barber ──────────────────────────────────────────────────

export interface Barber {
  barber_id: string; // uuid
  name: string;
  services: Service[];
}

// ── Service ─────────────────────────────────────────────────

export interface Service {
  service_id: string; // uuid
  name: string;
  price: number; // в рублях
  duration_minutes: number; // кратно 15
  is_active: boolean;
}

// ── Slot ────────────────────────────────────────────────────

export type SlotStatus = "free" | "booked" | "blocked";

export interface Slot {
  status: SlotStatus;
  time_start: string; // ISO 8601 date-time
  time_end: string; // ISO 8601 date-time
  booking?: SlotBooking; // присутствует только при status === 'booked'
}

export interface SlotBooking {
  booking_id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

// ── ScheduleDay ─────────────────────────────────────────────

export type PartOfDay = "am" | "pm";

export interface ScheduleDay {
  schedule_day_id: string;
  barber_id: string;
  date: string; // 'YYYY-MM-DD'
  start_time: string; // 'HH:mm'
  end_time: string; // 'HH:mm'
  part_of_day: PartOfDay;
}

// ── Booking ─────────────────────────────────────────────────

export type BookingStatus = "pending" | "completed" | "cancelled" | "no_show";

export interface Booking {
  booking_id: string;
  barber_id: string;
  service_id: string;
  service_name: string;
  client_name: string;
  client_phone: string;
  time_start: string; // ISO 8601 date-time
  time_end: string; // ISO 8601 date-time
  status: BookingStatus;
}

// ── Client ──────────────────────────────────────────────────

export interface Client {
  client_id: string;
  name: string;
  phone: string;
  notes?: string;
  visits_count: number;
  last_visit?: string; // 'YYYY-MM-DD'
}

// ── Analytics ───────────────────────────────────────────────

export interface TopService {
  service_id: string;
  service_name: string;
  count: number;
  revenue: number;
}

export interface DayStat {
  date: string;
  clients: number;
  revenue: number;
  hours_worked: number;
}

export interface BarberStats {
  barber_id: string;
  date_from: string;
  date_to: string;
  clients_served: number;
  total_revenue: number;
  hours_worked: number;
  average_check: number;
  bookings_total: number;
  bookings_completed: number;
  bookings_cancelled: number;
  bookings_no_show: number;
  occupancy_rate: number; // 0.0–1.0
  top_services: TopService[];
  daily_breakdown: DayStat[];
}

// ── Auth ────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // секунды
  barber: Barber;
}

// ── Ошибка API ──────────────────────────────────────────────

export interface ApiError {
  code: string; // e.g. 'NOT_FOUND', 'SLOT_TAKEN'
  message: string;
}

// ── Тела запросов (Request DTOs) ────────────────────────────

export interface CreateBookingDto {
  barber_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  time_start: string; // ISO 8601 date-time
}

export interface CreateStaffBookingDto {
  service_id: string;
  client_name: string;
  client_phone: string;
  time_start: string;
}

export interface UpdateBookingStatusDto {
  status: "cancelled" | "completed" | "no_show";
}

export interface UpsertScheduleDayDto {
  start_time: string;
  end_time: string;
  part_of_day: PartOfDay;
}

export interface CreateServiceDto {
  name: string;
  price: number;
  duration_minutes: number;
}

export interface UpdateServiceDto extends CreateServiceDto {
  is_active: boolean;
}

export interface UpdateClientDto {
  name?: string;
  notes?: string;
}

export type AnalyticsPeriod = "day" | "week" | "month" | "all";

export interface AnalyticsParams {
  period?: AnalyticsPeriod;
  date_from?: string;
  date_to?: string;
}
