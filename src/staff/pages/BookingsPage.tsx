import { useState, useEffect, useCallback } from "react";
import type { Booking, BookingStatus } from "../types/bookings";
import { MONTHS, MONTHS_NOM, getWeekStart } from "../types/bookings";
import { useStaffContext } from "../layout/StaffLayout";
import { http } from "../../api/client";
import { staffApi } from "../../api/endpoints";
import type { Slot } from "../../api/types";
import WeekView from "../components/bookings/WeekView";
import DayView from "../components/bookings/DayView";
import MonthView from "../components/bookings/MonthView";
import BookingDrawer from "../components/bookings/BookingDrawer";
import NewBookingModal from "../components/bookings/NewBookingModal";
import "../../staff-styles/bookings.css";

type View = "week" | "day" | "month";

function stripPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  let normalized = digits;
  if (digits.length === 11 && digits[0] === "8") {
    normalized = "7" + digits.slice(1);
  }
  return "+" + normalized;
}

function toLocalIso(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function toIsoWeek(weekStart: Date): string {
  const d = new Date(weekStart);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3);
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekNum =
    Math.round((d.getTime() - startOfWeek1.getTime()) / 604800000) + 1;
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

function dayIsoFromWeekStart(weekStart: Date, i: number): string {
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + i);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function apiDaysToShifts(
  days: Array<{ date: string; start_time: string; end_time: string }>,
  weekStart: Date,
): Record<number, { start: string; end: string } | null> {
  const result: Record<number, { start: string; end: string } | null> = {};
  for (let i = 0; i < 7; i++) {
    const iso = dayIsoFromWeekStart(weekStart, i);
    const found = days.find((d) => d.date === iso);
    result[i] = found
      ? {
          start: found.start_time.slice(0, 5),
          end: found.end_time.slice(0, 5),
        }
      : null;
  }
  return result;
}

function slotsToBookings(slots: Slot[], iso: string): Booking[] {
  const bookingsMap = new Map<
    string,
    {
      bookingId: string;
      clientName: string;
      clientPhone: string;
      serviceName: string;
      bookingStatus: BookingStatus;
      start: Date;
      end: Date;
    }
  >();

  for (const slot of slots) {
    if (slot.status === "booked" && slot.booking) {
      const bookingId = slot.booking.booking_id;
      const existing = bookingsMap.get(bookingId);
      const start = new Date(slot.time_start);
      const end = new Date(slot.time_end);
      if (!existing) {
        bookingsMap.set(bookingId, {
          bookingId,
          clientName: slot.booking.client_name,
          clientPhone: slot.booking.client_phone,
          serviceName: slot.booking.service_name,
          bookingStatus: (slot.booking.status ?? "pending") as BookingStatus,
          start,
          end,
        });
      } else {
        if (start < existing.start) existing.start = start;
        if (end > existing.end) existing.end = end;
      }
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(iso);
  const dayOffset = Math.round(
    (targetDate.getTime() - today.getTime()) / 86400000,
  );

  const result: Booking[] = [];
  let idCounter = Date.now();

  for (const [, data] of bookingsMap) {
    const startTime = data.start;
    const endTime = data.end;
    const durationMs = endTime.getTime() - startTime.getTime();
    const duration = Math.round(durationMs / 60000);
    const start =
      String(startTime.getUTCHours()).padStart(2, "0") +
      ":" +
      String(startTime.getUTCMinutes()).padStart(2, "0");
    const end =
      String(endTime.getUTCHours()).padStart(2, "0") +
      ":" +
      String(endTime.getUTCMinutes()).padStart(2, "0");

    result.push({
      id: idCounter++,
      apiId: data.bookingId,
      dayOffset,
      name: data.clientName,
      phone: data.clientPhone,
      service: data.serviceName,
      start,
      end,
      duration,
      status: data.bookingStatus,
      date: iso,
    });
  }

  return result;
}

function navLabel(
  view: View,
  weekOffset: number,
  dayOffset: number,
  monthOffset: number,
): string {
  if (view === "week") {
    const ws = getWeekStart(weekOffset);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    return `${ws.getDate()} — ${we.getDate()} ${MONTHS[we.getMonth()]}`;
  }
  if (view === "day") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    const dayNames = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
    return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${dayNames[d.getDay()]}`;
  }
  const t = new Date();
  const target = new Date(t.getFullYear(), t.getMonth() + monthOffset, 1);
  return `${MONTHS_NOM[target.getMonth()]} ${target.getFullYear()}`;
}

function headerMonth(
  view: View,
  weekOffset: number,
  dayOffset: number,
  monthOffset: number,
): string {
  if (view === "week") {
    const ws = getWeekStart(weekOffset);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    return ws.getMonth() === we.getMonth()
      ? `${MONTHS_NOM[ws.getMonth()]} ${ws.getFullYear()}`
      : `${MONTHS_NOM[ws.getMonth()]} — ${MONTHS_NOM[we.getMonth()]} ${we.getFullYear()}`;
  }
  if (view === "day") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
  }
  const t = new Date();
  const target = new Date(t.getFullYear(), t.getMonth() + monthOffset, 1);
  return `${MONTHS_NOM[target.getMonth()]} ${target.getFullYear()}`;
}

export default function BookingsPage() {
  const {
    bookings,
    setBookings,
    handleStatusChange,
    schedule,
    setSchedule,
    setClients,
    loadedDates,
    setLoadedDates,
  } = useStaffContext();

  const [view, setView] = useState<View>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [newBookingTime, setNewBookingTime] = useState<string | undefined>(
    undefined,
  );
  const [newBookingDate, setNewBookingDate] = useState<string | undefined>(
    undefined,
  );
  const [newBookingFreeSlots, setNewBookingFreeSlots] = useState<
    number | undefined
  >(undefined);
  const [showNewBooking, setShowNewBooking] = useState(false);

  const loadScheduleWeek = useCallback(
    async (offset: number) => {
      if (schedule[offset] !== undefined) return;

      const ws = getWeekStart(offset);
      const isoWeek = toIsoWeek(ws);
      try {
        const result = await staffApi.getSchedule(isoWeek);
        const shifts = apiDaysToShifts(result.days, ws);
        setSchedule((prev) => ({ ...prev, [offset]: shifts }));
      } catch (err) {
        console.error("BookingsPage: Failed to load schedule", err);
        setSchedule((prev) => ({ ...prev, [offset]: prev[offset] ?? {} }));
      }
    },
    [schedule, setSchedule],
  );

  useEffect(() => {
    if (view !== "week") return;
    loadScheduleWeek(weekOffset);
  }, [view, weekOffset, loadScheduleWeek]);

  useEffect(() => {
    if (view !== "day") return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);

    const targetDay = d.getDay();
    const diffToMon = targetDay === 0 ? -6 : 1 - targetDay;
    const targetMon = new Date(d);
    targetMon.setDate(d.getDate() + diffToMon);
    const curDay = today.getDay();
    const curMon = new Date(today);
    curMon.setDate(today.getDate() + (curDay === 0 ? -6 : 1 - curDay));
    const targetWeekOffset = Math.round(
      (targetMon.getTime() - curMon.getTime()) / (7 * 86400000),
    );

    loadScheduleWeek(targetWeekOffset);
  }, [view, dayOffset, loadScheduleWeek]);

  useEffect(() => {
    if (view !== "day") return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    const iso = toLocalIso(d);

    if (loadedDates.has(iso)) return;

    staffApi
      .getSlots(iso)
      .then(({ slots }) => {
        const loaded = slotsToBookings(slots, iso);
        setBookings((prev) => [
          ...prev.filter((b) => b.date !== iso),
          ...loaded,
        ]);
        setLoadedDates((prev) => new Set(prev).add(iso));
      })
      .catch(() => {});
  }, [view, dayOffset]);

  useEffect(() => {
    if (view !== "week") return;

    const ws = getWeekStart(weekOffset);
    const datesToLoad: string[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      const iso = toLocalIso(d);
      if (!loadedDates.has(iso)) {
        datesToLoad.push(iso);
      }
    }

    if (datesToLoad.length === 0) return;

    Promise.all(
      datesToLoad.map((iso) =>
        staffApi
          .getSlots(iso)
          .then(({ slots }) => ({ iso, bookings: slotsToBookings(slots, iso) }))
          .catch(() => ({ iso, bookings: [] })),
      ),
    ).then((results) => {
      setBookings((prev) => {
        let updated = [...prev];
        for (const { iso, bookings: loaded } of results) {
          updated = [...updated.filter((b) => b.date !== iso), ...loaded];
        }
        return updated;
      });
      setLoadedDates((prev) => {
        const next = new Set(prev);
        datesToLoad.forEach((iso) => next.add(iso));
        return next;
      });
    });
  }, [view, weekOffset]);

  const navPrev = () => {
    if (view === "week") setWeekOffset((w) => w - 1);
    if (view === "day") setDayOffset((d) => d - 1);
    if (view === "month") setMonthOffset((m) => m - 1);
  };
  const navNext = () => {
    if (view === "week") setWeekOffset((w) => w + 1);
    if (view === "day") setDayOffset((d) => d + 1);
    if (view === "month") setMonthOffset((m) => m + 1);
  };

  const goToDay = (dayIndex: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ws = getWeekStart(weekOffset);
    const target = new Date(ws);
    target.setDate(ws.getDate() + dayIndex);
    setDayOffset(Math.round((target.getTime() - today.getTime()) / 86400000));
    setView("day");
  };

  const goToDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDayOffset(Math.round((date.getTime() - today.getTime()) / 86400000));
    setView("day");
  };

  const onStatusChange = async (id: number, status: BookingStatus) => {
    const booking = bookings.find((b) => b.id === id);
    if (booking?.apiId) {
      try {
        await http.patch(`/staff/bookings/${booking.apiId}`, { status });
      } catch {}
    }
    handleStatusChange(id, status);
    setActiveBooking((prev) => (prev?.id === id ? { ...prev, status } : prev));
    if (booking?.date) {
      setLoadedDates((prev) => {
        const next = new Set(prev);
        next.delete(booking.date);
        return next;
      });
    }
  };

  const onDelete = async (id: number) => {
    const booking = bookings.find((b) => b.id === id);
    if (booking?.apiId) {
      try {
        await http.delete(`/staff/bookings/${booking.apiId}`);
      } catch {}
    }
    setBookings((prev) => prev.filter((b) => b.id !== id));
    if (booking?.date) {
      setLoadedDates((prev) => {
        const next = new Set(prev);
        next.delete(booking.date);
        return next;
      });
    }
  };

  const onUpdate = async (
    id: number,
    serviceId: string,
    serviceName: string,
    timeStart: string,
    start: string,
    end: string,
  ) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking?.apiId) return;

    try {
      await staffApi.updateBooking(booking.apiId, {
        service_id: serviceId,
        time_start: timeStart,
      });

      if (booking.date) {
        setLoadedDates((prev) => {
          const next = new Set(prev);
          next.delete(booking.date!);
          return next;
        });
      }

      const newDate = timeStart.slice(0, 10);

      if (newDate !== booking.date) {
        setLoadedDates((prev) => {
          const next = new Set(prev);
          next.delete(newDate);
          return next;
        });
      }

      const updatedBooking: Booking = {
        ...booking,
        service: serviceName,
        serviceId,
        start,
        end,
        date: newDate,
      };

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? updatedBooking : b)),
      );
      setActiveBooking(updatedBooking);
    } catch (err) {
      console.error("Failed to update booking", err);
    }
  };

  const label = navLabel(view, weekOffset, dayOffset, monthOffset);
  const month = headerMonth(view, weekOffset, dayOffset, monthOffset);

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <p className="staff-page-header__sub">{month}</p>
          <h1 className="staff-page-header__title">Записи</h1>
        </div>
        <div className="bookings-header-right">
          <div className="week-nav">
            <button className="week-nav__btn" onClick={navPrev}>
              &#x276E;
            </button>
            <span className="week-nav__label">{label}</span>
            <button className="week-nav__btn" onClick={navNext}>
              &#x276F;
            </button>
          </div>
          <div className="view-tabs">
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                className={`view-tab${view === v ? " view-tab--active" : ""}`}
                onClick={() => {
                  if (v === "week") {
                    const tod = new Date();
                    tod.setHours(0, 0, 0, 0);
                    const target = new Date(tod);
                    target.setDate(tod.getDate() + dayOffset);
                    const targetDay = target.getDay();
                    const diffToMon = targetDay === 0 ? -6 : 1 - targetDay;
                    const targetMon = new Date(target);
                    targetMon.setDate(target.getDate() + diffToMon);
                    const curDay = tod.getDay();
                    const curMon = new Date(tod);
                    curMon.setDate(
                      tod.getDate() + (curDay === 0 ? -6 : 1 - curDay),
                    );
                    setWeekOffset(
                      Math.round(
                        (targetMon.getTime() - curMon.getTime()) /
                          (7 * 86400000),
                      ),
                    );
                  }
                  if (v === "month") {
                    const tod = new Date();
                    const target = new Date(tod);
                    target.setDate(tod.getDate() + dayOffset);
                    setMonthOffset(
                      (target.getFullYear() - tod.getFullYear()) * 12 +
                        (target.getMonth() - tod.getMonth()),
                    );
                  }
                  setView(v);
                }}
              >
                {v === "day" ? "День" : v === "week" ? "Неделя" : "Месяц"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "week" && (
        <WeekView
          weekOffset={weekOffset}
          bookings={bookings}
          schedule={schedule}
          onDayClick={goToDay}
          onBookingClick={setActiveBooking}
        />
      )}
      {view === "day" && (
        <DayView
          dayOffset={dayOffset}
          bookings={bookings}
          schedule={schedule}
          onBookingClick={setActiveBooking}
          onAddSlot={(time, freeSlots, date) => {
            setNewBookingTime(time);
            setNewBookingDate(date);
            setNewBookingFreeSlots(freeSlots);
            setShowNewBooking(true);
          }}
        />
      )}
      {view === "month" && (
        <MonthView monthOffset={monthOffset} onDayClick={goToDate} />
      )}

      <BookingDrawer
        booking={activeBooking}
        onClose={() => setActiveBooking(null)}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />

      {showNewBooking && (
        <NewBookingModal
          presetTime={newBookingTime}
          presetDate={newBookingDate}
          freeSlots={newBookingFreeSlots}
          onClose={() => {
            setShowNewBooking(false);
            setNewBookingTime(undefined);
            setNewBookingDate(undefined);
          }}
          onSave={async (booking) => {
            const phone = stripPhone(booking.phone);
            try {
              const [y, mo, day] = (booking.date ?? "").split("-").map(Number);
              const [h, m] = booking.start.split(":").map(Number);
              const timeStart = new Date(
                Date.UTC(y, mo - 1, day, h, m),
              ).toISOString();
              const { data } = await http.post("/staff/bookings", {
                service_id: booking.serviceId,
                client_name: booking.name,
                client_phone: phone,
                time_start: timeStart,
              });
              const iso = booking.date ?? toLocalIso(new Date());
              if (booking.date) {
                setLoadedDates((prev) => {
                  const next = new Set(prev);
                  next.delete(iso);
                  return next;
                });
              }
              staffApi
                .getSlots(iso)
                .then(({ slots }) => {
                  const loaded = slotsToBookings(slots, iso);
                  setBookings((prev) => [
                    ...prev.filter((b) => b.date !== iso),
                    ...loaded,
                  ]);
                })
                .catch(() => {
                  setBookings((prev) => [
                    ...prev,
                    {
                      ...booking,
                      id: Date.now(),
                      apiId: data.booking_id,
                      phone,
                    },
                  ]);
                });
            } catch (err) {
              console.error("Failed to create booking", err);
              setBookings((prev) => [
                ...prev,
                { ...booking, id: Date.now(), phone },
              ]);
            }
            setClients((prev) => {
              if (prev.some((c) => c.phone === phone)) return prev;
              const newId =
                prev.length > 0 ? Math.max(...prev.map((c) => c.id)) + 1 : 1;
              return [
                ...prev,
                { id: newId, name: booking.name, phone, notes: "" },
              ];
            });
          }}
        />
      )}
    </div>
  );
}
