// ─────────────────────────────────────────────────────────────
// endpoints.ts — все эндпоинты API, сгруппированные по домену
// ─────────────────────────────────────────────────────────────

import { http } from "./client";
import type {
  Barber,
  Booking,
  CreateBookingDto,
  Service,
  Slot
} from "./types";

// ══════════════════════════════════════════════════════════════
// PUBLIC — без авторизации
// ══════════════════════════════════════════════════════════════

export const publicApi = {
  /** Список всех активных барберов с их услугами */
  getBarbers: async (): Promise<Barber[]> => {
    const { data } = await http.get<{ barbers: Barber[] }>("/barbers");
    return data.barbers;
  },

  /** Активные услуги конкретного барбера */
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

  /**
   * Создать запись (клиентский flow).
   * Коды ошибок: 409 — слот занят, 422 — невалидные данные.
   */
  createBooking: async (dto: CreateBookingDto): Promise<Booking> => {
    const { data } = await http.post<Booking>("/bookings", dto);
    return data;
  },
};
