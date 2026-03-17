import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { tokenStorage, ApiException } from "../api/client";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) return;

    setError(null);
    setIsPending(true);

    try {
      const { access_token, refresh_token } = await authApi.login(
        login.trim(),
        password,
      );
      tokenStorage.set(access_token);
      tokenStorage.setRefresh(refresh_token);
      navigate("/staff/bookings");
    } catch (err) {
      if (err instanceof ApiException && err.status === 401) {
        setError("Неверный логин или пароль");
      } else {
        setError("Что-то пошло не так. Попробуйте ещё раз.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-inner">
        <div className="login-header">
          <h1 className="login-header__title">Вход</h1>
          <p className="login-header__sub">Личный кабинет</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-field__label">Логин</label>
            <input
              className="login-field__input"
              type="text"
              placeholder="ivan"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label className="login-field__label">Пароль</label>
            <div className="login-field__password-wrap">
              <input
                className="login-field__input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-field__eye"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="login-error">{error}</div>

          <button
            className="login-submit"
            type="submit"
            disabled={isPending || !login.trim() || !password.trim()}
          >
            {isPending ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>

      <div className="login-footer">BarberCRM</div>
    </div>
  );
}
