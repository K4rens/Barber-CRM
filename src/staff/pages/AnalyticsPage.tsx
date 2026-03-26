import { useState } from "react";
import "../../staff-styles/analytics.css";

type Period = "day" | "month" | "all";

interface PeriodData {
  revenue: string;
  avgCheck: string;
  hours: string;
  occupancy: string;
  cancelRate: string;
  pending: string;
  total: string;
  completed: string;
  cancelled: string;
  noShow: string;
  top: { name: string; width: string; count: string }[];
}

const DATA: Record<Period, PeriodData> = {
  day: {
    revenue: "4 200 ₽",
    avgCheck: "1 400 ₽",
    hours: "6",
    occupancy: "62%",
    cancelRate: "25%",
    pending: "1",
    total: "4",
    completed: "3",
    cancelled: "1",
    noShow: "0",
    top: [
      { name: "Стрижка", width: "80%", count: "2" },
      { name: "Борода", width: "40%", count: "1" },
    ],
  },
  month: {
    revenue: "58 000 ₽",
    avgCheck: "1 381 ₽",
    hours: "96",
    occupancy: "78%",
    cancelRate: "10%",
    pending: "5",
    total: "50",
    completed: "42",
    cancelled: "5",
    noShow: "3",
    top: [
      { name: "Стрижка", width: "80%", count: "28" },
      { name: "Стрижка + борода", width: "45%", count: "16" },
      { name: "Борода", width: "25%", count: "9" },
    ],
  },
  all: {
    revenue: "420 000 ₽",
    avgCheck: "1 350 ₽",
    hours: "520",
    occupancy: "74%",
    cancelRate: "11%",
    pending: "8",
    total: "220",
    completed: "180",
    cancelled: "25",
    noShow: "15",
    top: [
      { name: "Стрижка", width: "80%", count: "120" },
      { name: "Стрижка + борода", width: "55%", count: "82" },
      { name: "Борода", width: "35%", count: "54" },
      { name: "Fade", width: "20%", count: "28" },
    ],
  },
};

const PERIOD_LABELS: Record<Period, string> = {
  day: "День",
  month: "Месяц",
  all: "Всё время",
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const d = DATA[period];

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
        <StatCard label="Выручка" value={d.revenue} />
        <StatCard label="Средний чек" value={d.avgCheck} />
        <StatCard label="Часов отработано" value={d.hours} />
        <StatCard label="Загруженность" value={d.occupancy} />
        <StatCard label="Процент отмен" value={d.cancelRate} />
        <StatCard label="Текущих записей" value={d.pending} />
      </div>

      <div className="analytics-section">
        <div className="analytics-block">
          <div className="analytics-block__title">Топ услуг</div>
          {d.top.map((s) => (
            <div key={s.name} className="top-service">
              <span className="top-service__name">{s.name}</span>
              <div className="top-service__bar">
                <div style={{ width: s.width }} />
              </div>
              <span className="top-service__count">{s.count}</span>
            </div>
          ))}
        </div>

        <div className="analytics-block">
          <div className="analytics-block__title">Итоги по записям</div>
          <div className="booking-stats">
            <div className="booking-stat">
              <span className="booking-stat__label">Всего</span>
              <span className="booking-stat__value">{d.total}</span>
            </div>
            <div className="booking-stat">
              <span className="booking-stat__label">Завершено</span>
              <span className="booking-stat__value">{d.completed}</span>
            </div>
            <div className="booking-stat">
              <span className="booking-stat__label">Отменено</span>
              <span className="booking-stat__value">{d.cancelled}</span>
            </div>
            <div className="booking-stat">
              <span className="booking-stat__label">Не пришли</span>
              <span className="booking-stat__value">{d.noShow}</span>
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
