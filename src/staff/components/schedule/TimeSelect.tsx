import { useState, useRef, useEffect, useCallback } from "react";

const TIME_OPTIONS = (() => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
})();

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function TimeSelect({
  value,
  onChange,
  disabled = false,
  className = "",
}: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const idx = TIME_OPTIONS.indexOf(value);
    if (idx === -1) return;
    const item = listRef.current.children[idx] as HTMLElement;
    if (item) {
      listRef.current.scrollTop =
        item.offsetTop -
        listRef.current.clientHeight / 2 +
        item.clientHeight / 2;
    }
  }, [open, value]);

  const handleSelect = useCallback(
    (t: string) => {
      onChange(t);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div
      ref={containerRef}
      className={`time-select-wrapper ${className}`}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        className="nb-field__input time-select"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          width: "100%",
        }}
      >
        <span>{value}</span>
        <span
          style={{
            marginLeft: 6,
            fontSize: 10,
            opacity: 0.5,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 9999,
            margin: "4px 0 0",
            padding: 0,
            listStyle: "none",
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 220,
            overflowY: "auto",
            minWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {TIME_OPTIONS.map((t) => (
            <li
              key={t}
              onMouseDown={() => handleSelect(t)}
              style={{
                padding: "7px 14px",
                cursor: "pointer",
                fontSize: 14,
                background: t === value ? "#1d4ed8" : "transparent",
                color: t === value ? "#fff" : "#111",
                fontWeight: t === value ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (t !== value)
                  (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                if (t !== value)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
