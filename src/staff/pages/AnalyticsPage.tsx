import { useState, useMemo } from "react";
import { useStaffContext } from "../layout/StaffLayout";
import type { Booking } from "../types/bookings";
import "../../staff-styles/analytics.css";

type Period = "day" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  day: "День",
  month: "Месяц",
  all: "Всё время",
};

const SERVICE_PRICES: Record<string, number> = {
  Стрижка: 1200,
  Борода: 800,
  "Стрижка + борода": 1800,
  Fade: 1500,
};

function toLocalIso(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function filterByPeriod(bookings: Booking[], period: Period): Booking[] {
  const now = new Date();
  const todayIso = toLocalIso(now);

  if (period === "day") {
    return bookings.filter((b) => b.date === todayIso);
  }
  if (period === "month") {
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return bookings.filter((b) => b.date?.startsWith(prefix));
  }
  return bookings; // all
}

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU") + " ₽";
}

export default function AnalyticsPage() {
  const { bookings } = useStaffContext();
  const [period, setPeriod] = useState<Period>("month");

  const filtered = useMemo(
    () => filterByPeriod(bookings, period),
    [bookings, period],
  );

  const stats = useMemo(() => {
    const total = filtered.length;
    const completed = filtered.filter((b) => b.status === "completed");
    const cancelled = filtered.filter((b) => b.status === "cancelled").length;
    const noShow = filtered.filter((b) => b.status === "no_show").length;
    const pending = filtered.filter((b) => b.status === "pending").length;

    const revenue = completed.reduce(
      (sum, b) => sum + (SERVICE_PRICES[b.service] ?? 0),
      0,
    );

    const avgCheck =
      completed.length > 0 ? Math.round(revenue / completed.length) : 0;

    const hours = Math.round(
      completed.reduce((sum, b) => sum + (b.duration ?? 45), 0) / 60,
    );

    const serviceCounts: Record<string, number> = {};
    filtered
      .filter((b) => b.status === "completed")
      .forEach((b) => {
        serviceCounts[b.service] = (serviceCounts[b.service] ?? 0) + 1;
      });
    const topServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const maxCount = topServices[0]?.[1] ?? 1;

    const cancelRate =
      total > 0 ? Math.round(((cancelled + noShow) / total) * 100) : 0;

    return {
      total,
      completed: completed.length,
      cancelled,
      noShow,
      pending,
      revenue,
      avgCheck,
      hours,
      topServices,
      maxCount,
      cancelRate,
    };
  }, [filtered]);

  const isEmpty = stats.total === 0;

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <p className="staff-page-header__sub">Статистика</p>
          <h1 className="staff-page-header__title">Аналитика</h1>
        </div>
        <div className="period-tabs">
          {(["day", "month", "all"] as Period[]).map((p) => (
            <button
              key={p}
              className={`period-tab${period === p ? " period-tab--active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-cards">
        <StatCard
          label="Выручка"
          value={isEmpty ? "—" : formatMoney(stats.revenue)}
        />
        <StatCard
          label="Средний чек"
          value={isEmpty ? "—" : formatMoney(stats.avgCheck)}
        />
        <StatCard
          label="Часов отработано"
          value={isEmpty ? "—" : String(stats.hours)}
        />
        <StatCard label="Завершено записей" value={String(stats.completed)} />
        <StatCard
          label="Процент отмен"
          value={isEmpty ? "—" : `${stats.cancelRate}%`}
        />
        <StatCard label="Текущих записей" value={String(stats.pending)} />
      </div>

      <div className="analytics-section">
        {/* Топ услуг */}
        <div className="analytics-block">
          <div className="analytics-block__title">Топ услуг</div>
          {stats.topServices.length === 0 ? (
            <div style={{ fontSize: 13, color: "#bbb", padding: "8px 0" }}>
              Нет данных
            </div>
          ) : (
            stats.topServices.map(([name, count]) => (
              <div key={name} className="top-service">
                <span className="top-service__name">{name}</span>
                <div className="top-service__bar">
                  <div
                    style={{
                      width: `${Math.round((count / stats.maxCount) * 100)}%`,
                    }}
                  />
                </div>
                <span className="top-service__count">{count}</span>
              </div>
            ))
          )}
        </div>

        <div className="analytics-block">
          <div className="analytics-block__title">Итоги по записям</div>
          <div className="booking-stats">
            <div className="booking-stat">
              <span className="booking-stat__label">Всего</span>
              <span className="booking-stat__value">{stats.total}</span>
            </div>
            <div className="booking-stat">
              <span className="booking-stat__label">Завершено</span>
              <span className="booking-stat__value">{stats.completed}</span>
            </div>
            <div className="booking-stat">
              <span className="booking-stat__label">Отменено</span>
              <span className="booking-stat__value">{stats.cancelled}</span>
            </div>
            <div className="booking-stat">
              <span className="booking-stat__label">Не пришли</span>
              <span className="booking-stat__value">{stats.noShow}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
    </div>
  );
}
