import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationProps {
  /** Título principal de la notificación */
  title: string;
  /** Color del título (cualquier valor CSS: hex, tailwind class string no aplica aquí, usa hex/rgb) */
  titleColor?: string;
  /** Texto secundario / subtítulo */
  subtitle?: string;
  /** Color del subtítulo */
  subtitleColor?: string;
  /** Color del borde de la tarjeta */
  borderColor?: string;
  /** Texto del label (ej: "Se exportaron", "ID asignado") */
  idLabel?: string;
  /** El valor a mostrar (número, string) */
  idValue?: string | number;
  /** Color del texto del ID */
  idColor?: string;
  /** Duración en milisegundos antes de auto-cerrar. 0 = no se cierra solo */
  duration?: number;
  /** Callback cuando se cierra la notificación */
  onClose?: () => void;
  /** Posición en la pila (0 es la más reciente/arriba) */
  index?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Notification({
  title,
  titleColor = "#a78bfa",
  subtitle,
  subtitleColor = "#d1d5db",
  borderColor = "#a78bfa",
  idLabel,
  idValue,
  idColor = "#a78bfa",
  duration = 4000,
  onClose,
  index = 0,
}: NotificationProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 350);
  }, [onClose]);

  // Entrada
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-cierre
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => close(), duration);
    return () => clearTimeout(t);
  }, [duration, close]);

  if (!visible && leaving) return null;

  // Stacking logic
  const translateY = index * 12; // 12px offset per level
  const scale = Math.max(1 - index * 0.05, 0.8); 
  const opacity = Math.max(1 - index * 0.2, 0); 
  const zIndex = 50 - index;

  return (
    <div
      style={{
        borderColor,
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity: visible && !leaving ? opacity : 0,
        zIndex,
        position: 'absolute',
        top: 0,
      }}
      className={`
        w-[320px] rounded-xl border-2 bg-[#FFFFFF] px-6 py-5
        shadow-[0_0_24px_rgba(0,0,0,0.3)]
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${visible && !leaving
          ? ""
          : "-translate-y-8 scale-95 !opacity-0"
        }
      `}
    >
      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-red-500 text-white text-xs font-bold hover:bg-red-400 transition-colors"
        aria-label="Cerrar"
      >
        ✕
      </button>

      {/* Title */}
      <p
        className="text-center text-2xl font-extrabold tracking-tight leading-tight"
        style={{ color: titleColor }}
      >
        {title}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p
          className="mt-2 text-center text-sm leading-snug"
          style={{ color: subtitleColor }}
        >
          {subtitle}
        </p>
      )}

      {/* ID line */}
      {idLabel !== undefined && idValue !== undefined && (
        <p
          className="mt-3 text-center text-sm font-semibold"
          style={{ color: idColor }}
        >
          {idLabel}{" "}
          <span className="font-bold">{idValue}</span>
        </p>
      )}
    </div>
  );
}

// ─── Manager (para múltiples notificaciones) ──────────────────────────────────

export interface NotificationItem extends NotificationProps {
  id: string;
}

let _addNotification: ((item: Omit<NotificationItem, "id">) => void) | null = null;

/**
 * Llama esto desde cualquier parte de tu app para disparar una notificación.
 *
 * @example
 * notify({
 *   title: "¡Registro Exitoso!",
 *   titleColor: "#22c55e",
 *   subtitle: "La persona fue registrada correctamente",
 *   assignedId: 42,
 *   borderColor: "#22c55e",
 *   duration: 4000,
 * });
 */
export function notify(item: Omit<NotificationItem, "id">) {
  _addNotification?.(item);
}

export function NotificationProvider() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    _addNotification = (item) => {
      const id = Math.random().toString(36).slice(2);
      // Newest on top (index 0)
      setNotifications((prev) => [{ ...item, id }, ...prev]);
    };
    return () => {
      _addNotification = null;
    };
  }, []);

  const remove = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[320px] h-0 flex flex-col items-center">
      {notifications.map((notif, idx) => (
        <Notification 
          key={notif.id} 
          {...notif} 
          index={idx} 
          onClose={() => remove(notif.id)} 
        />
      ))}
    </div>
  );
}