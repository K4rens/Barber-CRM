import {
  NavLink,
  Outlet,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import type { Shift, Template } from "../types/schedule";
import type { Booking, BookingStatus } from "../types/bookings";
import { tokenStorage } from "../../api/client";
import { authApi } from "../../api/endpoints";
import React, { useState } from "react";
import "./StaffLayout.css";

export interface Client {
  id: number;
  apiId?: string;
  name: string;
  phone: string;
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
}

export type ScheduleState = Record<number, Record<number, Shift | null>>;

export type StaffOutletContext = {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  updateNotes: (phone: string, notes: string) => void;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  schedule: ScheduleState;
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleState>>;
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  handleStatusChange: (id: number, status: BookingStatus) => void;
};

export function useStaffContext() {
  return useOutletContext<StaffOutletContext>();
}

const NAV_ITEMS = [
  {
    to: "/staff/bookings",
    label: "Записи",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: "/staff/schedule",
    label: "Расписание",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    to: "/staff/services",
    label: "Услуги",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    to: "/staff/clients",
    label: "Клиенты",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: "/staff/analytics",
    label: "Аналитика",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function StaffLayout() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<ScheduleState>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const barberName = tokenStorage.getBarberName() ?? "Барбер";
  const initials = barberName
    .split(" ")
    .map((n: string) => n[0])
    .join("");

  const handleStatusChange = (id: number, status: BookingStatus) =>
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b)),
    );

  const updateNotes = (phone: string, notes: string) =>
    setClients((prev) =>
      prev.map((c) => (c.phone === phone ? { ...c, notes } : c)),
    );

  const handleLogout = async () => {
    try {
      const refreshToken = tokenStorage.getRefresh();
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      tokenStorage.clear();
      navigate("/login");
    }
  };

  const outletContext = {
    clients,
    setClients,
    updateNotes,
    services,
    setServices,
    schedule,
    setSchedule,
    templates,
    setTemplates,
    bookings,
    setBookings,
    handleStatusChange,
  } satisfies StaffOutletContext;

  return (
    <div className="staff-app">
      <aside className="sidebar">
        <div className="sidebar__top">
          <div className="sidebar__brand">Barber CRM</div>
          <div className="sidebar__barber">
            <div className="sidebar__avatar">{initials}</div>
            <div className="sidebar__barber-info">
              <span className="sidebar__barber-name">{barberName}</span>
              <span className="sidebar__barber-role">Барбер</span>
            </div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                "nav-item" + (isActive ? " nav-item--active" : "")
              }
            >
              <span className="nav-item__icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="sidebar__logout"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Выйти
        </button>
      </aside>

      <header className="topbar">
        <button
          type="button"
          className={`topbar__burger${mobileMenuOpen ? " topbar__burger--open" : ""}`}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Меню"
        >
          <span />
          <span />
          <span />
        </button>
        <div className="topbar__brand">Barber CRM</div>
        <div className="topbar__profile">
          <span className="topbar__name">{barberName.split(" ")[0]}</span>
          <div className="topbar__avatar">{initials}</div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <nav className={`mobile-nav${mobileMenuOpen ? " mobile-nav--open" : ""}`}>
        <div className="mobile-nav__profile">
          <div className="mobile-nav__avatar">{initials}</div>
          <div>
            <div className="mobile-nav__name">{barberName}</div>
            <div className="mobile-nav__role">Барбер</div>
          </div>
        </div>
        <div className="mobile-nav__links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                "nav-item" + (isActive ? " nav-item--active" : "")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-item__icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <button
          type="button"
          className="mobile-nav__logout"
          onClick={() => {
            setMobileMenuOpen(false);
            setShowLogoutConfirm(true);
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Выйти
        </button>
      </nav>

      <main className="staff-content">
        <Outlet context={outletContext} />
      </main>

      {showLogoutConfirm && (
        <>
          <div
            className="staff-overlay"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="staff-modal staff-modal--sm">
            <div className="staff-modal__header">
              <span className="staff-modal__title">Выйти из аккаунта?</span>
              <button
                type="button"
                className="staff-modal__close"
                onClick={() => setShowLogoutConfirm(false)}
              >
                ✕
              </button>
            </div>
            <div className="staff-modal__actions">
              <button
                type="button"
                className="staff-btn staff-btn--danger"
                onClick={handleLogout}
              >
                Да, выйти
              </button>
              <button
                type="button"
                className="staff-btn staff-btn--secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
