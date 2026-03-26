import { http } from "./client";
import type { Barber, Booking, CreateBookingDto, Service, Slot } from "./types";

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

  /**
   * Свободные слоты барбера.
   * @param date     'YYYY-MM-DD' — если не передан, вернёт ближайший доступный день
   * @param serviceId UUID — если передан, фильтрует слоты под длительность услуги
   */
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