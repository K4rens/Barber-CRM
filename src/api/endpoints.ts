import { http } from "./client";
import type {
  Barber,
  Booking,
  CreateBookingDto,
  Service,
  Slot,
  ScheduleDay,
  UpsertScheduleDayDto,
  BarberStats,
  AnalyticsParams,
  Client as ApiClient,
  UpdateClientDto,
} from "./types";

export const publicApi = {
  getBarbers: async (): Promise<Barber[]> => {
    const { data } = await http.get<{ barbers: Barber[] }>("/barbers");
    return data.barbers;
  },

  getBarberServices: async (barberId: string): Promise<Service[]> => {
    const { data } = await http.get<{ services: Service[] }>(
      `/barbers/${barberId}/services`,
    );
    return data.services;
  },

  getFreeSlots: async (
    barberId: string,
    date?: string,
    serviceId?: string,
  ): Promise<{ date: string; slots: Slot[] }> => {
    const { data } = await http.get<{
      barber_id: string;
      date: string;
      slots: Slot[];
    }>(`/barbers/${barberId}/free-slots`, {
      params: { date, service_id: serviceId },
    });
    return { date: data.date, slots: data.slots };
  },

  createBooking: async (dto: CreateBookingDto): Promise<Booking> => {
    const { data } = await http.post<Booking>("/bookings", dto);
    return data;
  },
};

export const authApi = {
  login: async (login: string, password: string) => {
    const { data } = await http.post<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      barber: import("./types").Barber;
    }>("/auth/login", { login, password });
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await http.post("/auth/logout", { refresh_token: refreshToken });
  },
};

export const staffApi = {
  getSchedule: async (
    week: string,
  ): Promise<{ week: string; days: ScheduleDay[] }> => {
    const { data } = await http.get<{ week: string; days: ScheduleDay[] }>(
      "/staff/schedule",
      { params: { week } },
    );
    return data;
  },

  upsertScheduleDay: async (
    date: string,
    dto: UpsertScheduleDayDto,
  ): Promise<ScheduleDay> => {
    const { data } = await http.put<ScheduleDay>(
      `/staff/schedule/${date}`,
      dto,
    );
    return data;
  },

  deleteScheduleDay: async (date: string): Promise<void> => {
    await http.delete(`/staff/schedule/${date}`);
  },

  getSlots: async (date: string): Promise<{ date: string; slots: Slot[] }> => {
    const { data } = await http.get<{ date: string; slots: Slot[] }>(
      "/staff/slots",
      { params: { date } },
    );
    return data;
  },

  getAnalytics: async (params: AnalyticsParams): Promise<BarberStats> => {
    const { data } = await http.get<BarberStats>("/staff/analytics", {
      params,
    });
    return data;
  },

  getClients: async (search?: string): Promise<ApiClient[]> => {
    const { data } = await http.get<{ clients: ApiClient[] }>(
      "/staff/clients",
      { params: search ? { search } : undefined },
    );
    return data.clients;
  },

  getClientBookings: async (
    phone: string,
    limit = 50,
    offset = 0,
  ): Promise<{ bookings: Booking[]; total: number }> => {
    const { data } = await http.get<{
      bookings: Booking[];
      total: number;
      limit: number;
      offset: number;
    }>("/staff/clients/bookings", {
      params: { phone, limit, offset },
    });
    return { bookings: data.bookings, total: data.total };
  },

  updateClient: async (
    clientId: string,
    dto: UpdateClientDto,
  ): Promise<void> => {
    await http.put(`/staff/clients/${clientId}`, dto);
  },
  deleteClient: async (clientId: string): Promise<void> => {
    await http.delete(`/staff/clients/${clientId}`);
  },

  getBookingSettings: async (): Promise<{ compact_slots_enabled: boolean }> => {
    const { data } = await http.get("/staff/booking-settings");
    return data;
  },

  setCompactSlots: async (
    enabled: boolean,
  ): Promise<{ compact_slots_enabled: boolean }> => {
    const { data } = await http.patch("/staff/booking-settings/compact-slots", {
      enabled,
    });
    return data;
  },
};
