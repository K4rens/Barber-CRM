export interface Barber {
  barber_id: string; // uuid
  name: string;
  services: Service[];
}


export interface Service {
  service_id: string; 
  name: string;
  price: number; 
  duration_minutes: number; 
  is_active: boolean;
}


export type SlotStatus = "free" | "booked" | "blocked";

export interface Slot {
  status: SlotStatus;
  time_start: string; 
  time_end: string; 
  booking?: SlotBooking; 
}

export interface SlotBooking {
  booking_id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}


export type PartOfDay = "am" | "pm";

export interface ScheduleDay {
  schedule_day_id: string;
  barber_id: string;
  date: string; 
  start_time: string; 
  end_time: string; 
  part_of_day: PartOfDay;
}

// Booking 

export type BookingStatus = "pending" | "completed" | "cancelled" | "no_show";

export interface Booking {
  booking_id: string;
  barber_id: string;
  service_id: string;
  service_name: string;
  client_name: string;
  client_phone: string;
  time_start: string; 
  time_end: string; 
  status: BookingStatus;
}


export interface Client {
  client_id: string;
  name: string;
  phone: string;
  notes?: string;
  visits_count: number;
  last_visit?: string; 
}


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



export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; 
  barber: Barber;
}


export interface ApiError {
  code: string;
  message: string;
}


export interface CreateBookingDto {
  barber_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  time_start: string; 
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
