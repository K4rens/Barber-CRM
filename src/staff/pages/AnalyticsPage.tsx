import { useState, useEffect } from "react";
import { http } from "../../api/client";
import "../../staff-styles/analytics.css";

type Period = "day" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  day: "День",
  month: "Месяц",
  all: "Всё время",
};

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU") + " ₽";
}

function formatNum(n: number): string {
  return n.toLocaleString("ru-RU");
}

interface Stats {
  clients_served: number;
  total_revenue: number;
  hours_worked: number;
  average_check: number;
  bookings_total: number;
  bookings_completed: number;
  bookings_cancelled: number;
  bookings_no_show: number;
  bookings_pending: number;
  occupancy_rate: number;
  top_services: {
    service_id: string;
    service_name: string;
    count: number;
    revenue: number;
  }[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setShowLoading(true), 150);
    http
      .get("/staff/analytics", { params: { period } })
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setShowLoading(false);
        clearTimeout(timer);
      });
    return () => clearTimeout(timer);
  }, [period]);

  const isEmpty = !stats || stats.bookings_total === 0;
  const maxCount = stats?.top_services?.[0]?.count ?? 1;
  const cancelRate =
    stats && stats.bookings_total > 0
      ? Math.round(
          ((stats.bookings_cancelled + stats.bookings_no_show) /
            stats.bookings_total) *
            100,
        )
      : 0;
  const pending = stats
    ? stats.bookings_total -
      stats.bookings_completed -
      stats.bookings_cancelled -
      stats.bookings_no_show
    : 0;

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

      {stats === null && loading ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "#bbb",
            fontSize: 13,
          }}
        >
          Загрузка...
        </div>
      ) : (
        <div
          style={{
            opacity: showLoading ? 0.5 : 1,
            transition: "opacity 0.15s ease",
            pointerEvents: loading ? "none" : "auto",
            minHeight: 400,
          }}
        >
          <div className="stat-cards">
            <StatCard
              label="Выручка"
              value={isEmpty ? "—" : formatMoney(stats!.total_revenue)}
            />
            <StatCard
              label="Средний чек"
              value={
                isEmpty ? "—" : formatMoney(Math.round(stats!.average_check))
              }
            />
            <StatCard
              label="Часов отработано"
              value={isEmpty ? "—" : String(Math.round(stats!.hours_worked))}
            />
            <StatCard
              label="Завершено записей"
              value={formatNum(stats?.bookings_completed ?? 0)}
            />
            <StatCard
              label="Процент отмен"
              value={isEmpty ? "—" : `${cancelRate}%`}
            />
            <StatCard label="Текущих записей" value={formatNum(pending)} />
          </div>

          <div className="analytics-section">
            <div className="analytics-block" style={{ minHeight: 160 }}>
              <div className="analytics-block__title">Топ услуг</div>
              {!stats?.top_services?.length ? (
                <div style={{ fontSize: 13, color: "#bbb", padding: "8px 0" }}>
                  Нет данных
                </div>
              ) : (
                stats.top_services.map((s) => (
                  <div key={s.service_id} className="top-service">
                    <span className="top-service__name">{s.service_name}</span>
                    <div className="top-service__bar">
                      <div
                        style={{
                          width: `${Math.round((s.count / maxCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="top-service__count">{s.count}</span>
                  </div>
                ))
              )}
            </div>

            <div className="analytics-block">
              <div className="analytics-block__title">Итоги по записям</div>
              <div className="booking-stats">
                <div className="booking-stat">
                  <span className="booking-stat__label">Всего</span>
                  <span className="booking-stat__value">
                    {stats?.bookings_total ?? 0}
                  </span>
                </div>
                <div className="booking-stat">
                  <span className="booking-stat__label">Завершено</span>
                  <span className="booking-stat__value">
                    {stats?.bookings_completed ?? 0}
                  </span>
                </div>
                <div className="booking-stat">
                  <span className="booking-stat__label">Отменено</span>
                  <span className="booking-stat__value">
                    {stats?.bookings_cancelled ?? 0}
                  </span>
                </div>
                <div className="booking-stat">
                  <span className="booking-stat__label">Не пришли</span>
                  <span className="booking-stat__value">
                    {stats?.bookings_no_show ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
