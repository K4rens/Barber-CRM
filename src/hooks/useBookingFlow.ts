import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publicApi } from "../api/endpoints";
import { ApiException } from "../api/client";
import type { Booking, CreateBookingDto } from "../api/types";

// Query Keys

export const qk = {
  barbers: ["barbers"] as const,
  barberServices: (id: string) => ["barbers", id, "services"] as const,
  freeSlots: (id: string, date?: string, serviceId?: string) =>
    ["barbers", id, "free-slots", date, serviceId] as const,
};

//  useBarbers 

export function useBarbers() {
  return useQuery({
    queryKey: qk.barbers,
    queryFn: publicApi.getBarbers,
    staleTime: 5 * 60_000,
  });
}

//  useBarberServices 

export function useBarberServices(barberId: string | null) {
  return useQuery({
    queryKey: qk.barberServices(barberId ?? ""),
    queryFn: () => publicApi.getBarberServices(barberId!),
    enabled: !!barberId,
    staleTime: 5 * 60_000,
  });
}

//  useFreeSlots 

export function useFreeSlots(
  barberId: string | null,
  date: string | undefined,
  serviceId: string | undefined,
) {
  return useQuery({
    queryKey: qk.freeSlots(barberId ?? "", date, serviceId),
    queryFn: () => publicApi.getFreeSlots(barberId!, date, serviceId),
    enabled: !!barberId,
    staleTime: 60_000,
  });
}

//useCreateBooking 

export function useCreateBooking(
  onSuccess?: (data: Booking) => void,
  onError?: (error: ApiException) => void,
) {
  const qc = useQueryClient();
  return useMutation<Booking, ApiException, CreateBookingDto>({
    mutationFn: publicApi.createBooking,
    onSuccess: (data, variables) => {
      qc.invalidateQueries({
        queryKey: ["barbers", variables.barber_id, "free-slots"],
      });
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    },
  });
}

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: "Это время уже занято. Пожалуйста, выберите другой слот.",
  NOT_FOUND: "Барбер или услуга не найдены.",
  UNKNOWN: "Что-то пошло не так. Попробуйте ещё раз.",
};

export function getBookingErrorMessage(error: ApiException): string {
  if (error.status === 409) return ERROR_MESSAGES.SLOT_TAKEN;
  if (error.status === 422) return `Некорректные данные: ${error.message}`;
  if (error.status === 404) return ERROR_MESSAGES.NOT_FOUND;
  return ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.UNKNOWN;
}
