import { http, HttpResponse } from "msw";

const BARBERS = [
  {
    barber_id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Артём Волков",
    services: [
      {
        service_id: "svc-001",
        name: "Стрижка",
        price: 1200,
        duration_minutes: 45,
        is_active: true,
      },
      {
        service_id: "svc-002",
        name: "Борода",
        price: 800,
        duration_minutes: 30,
        is_active: true,
      },
    ],
  },
  {
    barber_id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Максим Орлов",
    services: [
      {
        service_id: "svc-003",
        name: "Fade",
        price: 1500,
        duration_minutes: 60,
        is_active: true,
      },
    ],
  },
];

export const handlers = [
  // GET /api/v1/barbers
  http.get("/api/v1/barbers", () => {
    return HttpResponse.json({ barbers: BARBERS });
  }),

  // GET /api/v1/barbers/:id/services
  http.get("/api/v1/barbers/:barber_id/services", ({ params }) => {
    const barber = BARBERS.find((b) => b.barber_id === params.barber_id);
    if (!barber)
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "barber not found" },
        { status: 404 },
      );
    return HttpResponse.json({ services: barber.services });
  }),

  // GET /api/v1/barbers/:id/free-slots
  http.get("/api/v1/barbers/:barber_id/free-slots", () => {
    const slots = Array.from({ length: 8 }, (_, i) => ({
      status: "free",
      time_start: `2026-03-20T${10 + i}:00:00Z`,
      time_end: `2026-03-20T${10 + i}:45:00Z`,
    }));
    return HttpResponse.json({ barber_id: "...", date: "2026-03-20", slots });
  }),

  // POST /api/v1/bookings
  http.post("/api/v1/bookings", async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    return HttpResponse.json(
      {
        booking_id: "booking-123",
        ...body,
        service_name: "Стрижка",
        time_end: "2026-03-20T10:45:00Z",
        status: "pending",
      },
      { status: 201 },
    );
  }),
];
