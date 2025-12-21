import { useEffect, useMemo, useState } from "react"
import Badge from "../../components/ui/badge/Badge"
import Button from "../../components/ui/button/Button"
import { HiTrash, HiMap } from "react-icons/hi"

/* =======================
   Tipos
======================= */
export interface Shipment {
  id: number
  shipment_code: string
  shipment_date: string
  shipment_status: "Pending" | "Active" | "Delivered" | string

  shipment_origin: string
  shipment_destination: string

  shipment_origin_address?: string | null
  shipment_destination_address?: string | null

  shipment_sender_name: string
  shipment_sender_phonenumber: string
  shipment_receiver_name: string
  shipment_receiver_phonenumber: string
  shipment_description: string
  shipment_assigned_user: string | null
  shipment_user: number

  shipment_driver?: number | null
  pickup_started_at?: string | null
  arrived_at?: string | null
  delivered_at?: string | null
  travel_time_seconds?: number | null

  shipment_distance_km?: number | string | null
  delivered_by?: number | null
  created_at?: string | null
  updated_at?: string | null

  shipment_origin_lat?: number | string | null
  shipment_origin_lng?: number | string | null
  shipment_destination_lat?: number | string | null
  shipment_destination_lng?: number | string | null

  shipment_driver_distance_km?: number | string | null
  shipment_driver_payout_estimated?: number | string | null
}

export interface ShipmentDetailsModalProps {
  open: boolean
  onClose: () => void
  shipment: Shipment | null

  getProvinceName: (id: string) => string
  getUserDisplay: (userId: number) => string
  getDriverDisplay: (driverId?: number | null) => string
  getDeliveredByDisplay: (id?: number | null) => string

  onDeleteShipment: (shipmentId: number) => Promise<void>
}

/* =======================
   Helpers
======================= */
const formatDate = (dateString: string) => {
  const d = new Date(dateString)
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const formatDateTime = (dateString: string) => {
  const d = new Date(dateString)
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const telHref = (phone?: string) => (phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined)

const mapsHref = (from: string, to: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(
    to
  )}&travelmode=driving`

const hhmmss = (secs: number) => {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

const toNumberOrNull = (v: any): number | null => {
  if (v == null) return null
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

const km = (v: any): string => {
  const n = toNumberOrNull(v)
  if (n == null) return "—"
  return `${n.toFixed(2)} km`
}

const money = (v: any): string => {
  const n = toNumberOrNull(v)
  if (n == null) return "—"
  return n.toLocaleString("es-PA", { style: "currency", currency: "USD" })
}

/* =======================
   UI Pieces
======================= */
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-4">
      <h3 className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-white/50 mb-3">
        {title}
      </h3>
      {children}
    </section>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-600 dark:text-white/70">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right break-words">
        {value}
      </span>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-white/50">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{value}</p>
      {hint ? <p className="text-xs text-gray-500 dark:text-white/40 mt-1">{hint}</p> : null}
    </div>
  )
}

/* =======================
   Component
======================= */
export default function ShipmentDetailsModal({
  open,
  onClose,
  shipment,
  getProvinceName,
  getUserDisplay,
  getDriverDisplay,
  getDeliveredByDisplay,
  onDeleteShipment,
}: ShipmentDetailsModalProps) {
  const [elapsed, setElapsed] = useState<number>(0)

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined

    if (
      open &&
      shipment &&
      shipment.pickup_started_at &&
      shipment.shipment_status?.toString().toUpperCase() === "EN CAMINO PARA PICKUP"
    ) {
      const start = new Date(shipment.pickup_started_at).getTime()
      const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)))
      tick()
      t = setInterval(tick, 1000)
    } else {
      setElapsed(0)
    }

    return () => {
      if (t) clearInterval(t)
    }
  }, [open, shipment?.pickup_started_at, shipment?.shipment_status])

  const computed = useMemo(() => {
    if (!shipment) return null

    const statusUpper = (shipment.shipment_status || "").toString().toUpperCase()

    const colorByStatus =
      statusUpper === "ACTIVE" || statusUpper === "EN CAMINO PARA PICKUP"
        ? "success"
        : statusUpper === "PENDING"
        ? "warning"
        : statusUpper === "DELIVERED" || statusUpper === "ENTREGADO"
        ? "success"
        : "info"

    const originName = getProvinceName(shipment.shipment_origin)
    const destName = getProvinceName(shipment.shipment_destination)

    const originLabel = shipment.shipment_origin_address?.trim()
      ? `${originName} · ${shipment.shipment_origin_address}`
      : originName

    const destLabel = shipment.shipment_destination_address?.trim()
      ? `${destName} · ${shipment.shipment_destination_address}`
      : destName

    const mapsFrom = shipment.shipment_origin_address?.trim() || originName
    const mapsTo = shipment.shipment_destination_address?.trim() || destName

    const finishedSeconds =
      typeof shipment.travel_time_seconds === "number"
        ? shipment.travel_time_seconds
        : shipment.arrived_at && shipment.pickup_started_at
        ? Math.max(
            0,
            Math.floor(
              (new Date(shipment.arrived_at).getTime() - new Date(shipment.pickup_started_at).getTime()) / 1000
            )
          )
        : null

    const hasDeliveredButNoDeliveredAt =
      (statusUpper === "DELIVERED" || statusUpper === "ENTREGADO") && !shipment.delivered_at

    const hasActiveButNoDriver =
      (statusUpper === "ACTIVE" || statusUpper === "EN CAMINO PARA PICKUP" || statusUpper === "ARRIVED") &&
      !shipment.shipment_driver

    const hasNoCoords =
      !shipment.shipment_origin_lat ||
      !shipment.shipment_origin_lng ||
      !shipment.shipment_destination_lat ||
      !shipment.shipment_destination_lng

    const alerts = [
      hasDeliveredButNoDeliveredAt ? "Estado Delivered pero delivered_at vacío" : null,
      hasActiveButNoDriver ? "Estado activo pero sin conductor" : null,
      hasNoCoords ? "Faltan coordenadas, puede fallar geofence" : null,
    ].filter(Boolean) as string[]

    return {
      statusUpper,
      colorByStatus,
      originLabel,
      destLabel,
      mapsFrom,
      mapsTo,
      finishedSeconds,
      alerts,
    }
  }, [shipment, getProvinceName])

  if (!open || !shipment || !computed) return null

  const { statusUpper, colorByStatus, originLabel, destLabel, mapsFrom, mapsTo, finishedSeconds, alerts } = computed

  const onDelete = async () => {
    if (!confirm(`¿Eliminar envío ${shipment.shipment_code}?`)) return
    await onDeleteShipment(shipment.id)
  }

  const timeLabel =
    statusUpper === "EN CAMINO PARA PICKUP" && shipment.pickup_started_at
      ? hhmmss(elapsed)
      : finishedSeconds != null
      ? hhmmss(finishedSeconds)
      : "—"

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-[92%] max-w-4xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-white/[0.08] bg-gradient-to-r from-gray-50 to-white dark:from-white/[0.03] dark:to-white/[0.02]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-white/50">Envío</p>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                {shipment.shipment_code}
              </h2>

              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge size="sm" color={colorByStatus as any}>
                  {shipment.shipment_status}
                </Badge>

                <span className="text-xs text-gray-500 dark:text-white/50">
                  {formatDate(shipment.shipment_date)}
                </span>

                {shipment.updated_at ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/[0.04] dark:text-white/60 dark:border-white/[0.06]">
                    Actualizado: {formatDateTime(shipment.updated_at)}
                  </span>
                ) : null}

                {alerts.length ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-200 dark:border-yellow-400/20">
                    ⚠ {alerts.length} alerta{alerts.length > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white transition"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Distancia envío" value={km(shipment.shipment_distance_km)} hint="Origen → destino" />
            <StatCard
              label={statusUpper === "EN CAMINO PARA PICKUP" ? "Tiempo en ruta" : "Tiempo total"}
              value={timeLabel}
              hint="Tracking interno"
            />
            <StatCard label="Pago estimado driver" value={money(shipment.shipment_driver_payout_estimated)} hint="Estimado" />
          </div>

          {/* Alerts list */}
          {alerts.length ? (
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-400/20 dark:bg-yellow-500/10 dark:text-yellow-100">
              <p className="text-xs uppercase tracking-wide font-medium mb-2 opacity-80">Alertas</p>
              <ul className="list-disc pl-5 space-y-1">
                {alerts.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
          {/* Left column */}
          <div className="space-y-4">
            <Section title="Remitente">
              <div className="space-y-2">
                <InfoRow label="Nombre" value={shipment.shipment_sender_name || "—"} />
                <InfoRow
                  label="Teléfono"
                  value={
                    shipment.shipment_sender_phonenumber ? (
                      <a className="text-blue-600 dark:text-blue-400" href={telHref(shipment.shipment_sender_phonenumber)}>
                        {shipment.shipment_sender_phonenumber}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <InfoRow label="Pickup" value={originLabel} />
              </div>
            </Section>

            <Section title="Destinatario">
              <div className="space-y-2">
                <InfoRow label="Nombre" value={shipment.shipment_receiver_name || "—"} />
                <InfoRow
                  label="Teléfono"
                  value={
                    shipment.shipment_receiver_phonenumber ? (
                      <a className="text-blue-600 dark:text-blue-400" href={telHref(shipment.shipment_receiver_phonenumber)}>
                        {shipment.shipment_receiver_phonenumber}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <InfoRow label="Delivery" value={destLabel} />
              </div>
            </Section>

            <Section title="Descripción">
              <p className="text-sm text-gray-800 dark:text-white/90 leading-relaxed break-words">
                {shipment.shipment_description || "Sin descripción"}
              </p>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Section title="Interno">
              <div className="space-y-2">
                <InfoRow label="Creado por" value={getUserDisplay(shipment.shipment_user)} />
                <InfoRow
                  label="Creado el"
                  value={
                    shipment.created_at ? formatDateTime(shipment.created_at) : formatDateTime(shipment.shipment_date)
                  }
                />
                <InfoRow label="Actualizado" value={shipment.updated_at ? formatDateTime(shipment.updated_at) : "—"} />
                <InfoRow label="Conductor asignado" value={getDriverDisplay(shipment.shipment_driver ?? null)} />
              </div>
            </Section>

            <Section title="Timeline">
              <div className="space-y-2 text-sm">
                <InfoRow
                  label="Pickup iniciado"
                  value={shipment.pickup_started_at ? formatDateTime(shipment.pickup_started_at) : "—"}
                />
                <InfoRow label="Llegó" value={shipment.arrived_at ? formatDateTime(shipment.arrived_at) : "—"} />
                <InfoRow label="Entregado" value={shipment.delivered_at ? formatDateTime(shipment.delivered_at) : "—"} />
              </div>
            </Section>

            <Section title="Auditoría y Pago">
              <div className="space-y-2">
                <InfoRow label="Entregado por" value={getDeliveredByDisplay(shipment.delivered_by ?? null)} />
                <InfoRow label="Distancia ruta driver" value={km(shipment.shipment_driver_distance_km)} />
                <InfoRow label="Pago estimado driver" value={money(shipment.shipment_driver_payout_estimated)} />
              </div>
            </Section>

            <Section title="Debug">
              <div className="space-y-2">
                <InfoRow
                  label="Origen"
                  value={`${shipment.shipment_origin_lat ?? "—"}, ${shipment.shipment_origin_lng ?? "—"}`}
                />
                <InfoRow
                  label="Destino"
                  value={`${shipment.shipment_destination_lat ?? "—"}, ${shipment.shipment_destination_lng ?? "—"}`}
                />
              </div>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/[0.08] flex items-center gap-2 justify-end bg-white dark:bg-gray-900">
          <a target="_blank" rel="noreferrer" href={mapsHref(mapsFrom, mapsTo)}>
            <Button size="sm" variant="outline" className="px-3">
              <HiMap className="w-4 h-4 mr-2" />
              Maps
            </Button>
          </a>

          <Button
            size="sm"
            variant="outline"
            className="px-3 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={onDelete}
          >
            <HiTrash className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}
