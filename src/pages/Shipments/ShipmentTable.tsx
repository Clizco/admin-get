// src/views/admin/ShipmentTable.tsx
import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import Badge from "../../components/ui/badge/Badge"
import Select from "../../components/form/Select"
import Button from "../../components/ui/button/Button"
import { HiEye, HiTrash, HiMap } from "react-icons/hi"

// ✅ IMPORT DEL MODAL SEPARADO
import ShipmentDetailsModal, { Shipment } from "../../components/Modals/ShipmentDetailsModal"

/* =======================
   Tipos (solo los que NO están en el modal)
======================= */
interface Province {
  id: number
  province_name: string
}

interface UserRow {
  id: number
  user_firstname?: string
  user_lastname?: string
  user_email: string
}

interface DriverRow {
  id: number
  driver_name: string
  driver_email?: string
  driver_phonenumber?: string
}

/* =======================
   helpers & config
======================= */
const apiUrl = import.meta.env.VITE_API_URL || ""

const statusOptions = [
  { value: "Pending", label: "Pendiente" },
  { value: "Active", label: "Activo" },
  { value: "Delivered", label: "Entregado" },
]

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const mapsHref = (from: string, to: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    from
  )}&destination=${encodeURIComponent(to)}&travelmode=driving`

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

/* =======================
   MAIN COMPONENT
======================= */
export default function ShipmentTable() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [provinces, setProvinces] = useState<Record<number, string>>({})
  const [allProvinces, setAllProvinces] = useState<Province[]>([])
  const [usersMap, setUsersMap] = useState<Record<number, string>>({})
  const [driversMap, setDriversMap] = useState<Record<number, string>>({})
  const [, setLoading] = useState(false)
  const [fade, setFade] = useState(false)

  // filtros
  const [statusFilter, setStatusFilter] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("")

  // modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // fetch provincias
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await axios.get<Province[]>(
          `${apiUrl}/provinces/provinces/all`
        )
        const map: Record<number, string> = {}
        data.forEach((p) => (map[p.id] = p.province_name))
        setProvinces(map)
        setAllProvinces(data)
      } catch (error) {
        console.error("Error fetching province data:", error)
      }
    })()
  }, [])

  // fetch usuarios
  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const { data } = await axios.get<UserRow[]>(
          `${apiUrl}/users/users/all`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        )
        const map: Record<number, string> = {}
        ;(data || []).forEach((u) => {
          const name = `${u.user_firstname ?? ""} ${u.user_lastname ?? ""}`.trim()
          map[u.id] = name || u.user_email
        })
        setUsersMap(map)
      } catch (e) {
        console.error("Error fetching users:", e)
      }
    })()
  }, [])

  // fetch drivers
  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const { data } = await axios.get<DriverRow[]>(
          `${apiUrl}/drivers/drivers/all`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        )
        const map: Record<number, string> = {}
        ;(data || []).forEach((d) => {
          map[d.id] = d.driver_name || `Driver ${d.id}`
        })
        setDriversMap(map)
      } catch (e) {
        console.error("Error fetching drivers:", e)
      }
    })()
  }, [])

  // fetch envíos
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (!token) return
        const { data } = await axios.get<Shipment[]>(
          `${apiUrl}/shipments/shipments/all`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setShipments(data)
      } catch (error) {
        console.error("Error fetching shipment data:", error)
      } finally {
        setLoading(false)
        setTimeout(() => setFade(true), 50)
      }
    }
    setFade(false)
    fetchShipments()
  }, [])

  const getProvinceName = (provinceId: string) =>
    provinces[Number(provinceId)] || "Desconocido"

  const originLabel = (s: Shipment) =>
    s.shipment_origin_address?.trim()
      ? `${getProvinceName(s.shipment_origin)} · ${s.shipment_origin_address}`
      : getProvinceName(s.shipment_origin)

  const destLabel = (s: Shipment) =>
    s.shipment_destination_address?.trim()
      ? `${getProvinceName(s.shipment_destination)} · ${s.shipment_destination_address}`
      : getProvinceName(s.shipment_destination)

  const mapsFromValue = (s: Shipment) =>
    s.shipment_origin_address?.trim() || getProvinceName(s.shipment_origin)

  const mapsToValue = (s: Shipment) =>
    s.shipment_destination_address?.trim() || getProvinceName(s.shipment_destination)

  const closeDetails = () => {
    setIsDetailsOpen(false)
    setSelectedShipment(null)
  }

  const deleteShipment = async (shipmentId: number) => {
    const s = shipments.find((x) => x.id === shipmentId)
    const label = s?.shipment_code ? ` (${s.shipment_code})` : ""

    if (
      !confirm(
        `¿Estás seguro de eliminar este envío${label}? Esta acción no se puede deshacer`
      )
    ) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${apiUrl}/shipments/shipments/delete/${shipmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      setShipments((prev) => prev.filter((x) => x.id !== shipmentId))
      if (selectedShipment?.id === shipmentId) closeDetails()
    } catch (e: any) {
      console.error("Error eliminando envío:", e)
      alert(e?.response?.data?.message || "No se pudo eliminar el envío")
    }
  }

  // filtros
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchStatus = statusFilter ? s.shipment_status === statusFilter : true
      const matchProvince = provinceFilter
        ? String(s.shipment_destination) === provinceFilter
        : true
      return matchStatus && matchProvince
    })
  }, [shipments, statusFilter, provinceFilter])

  // badge color
  const badgeColor = (
    status: string
  ): "success" | "warning" | "error" | undefined => {
    const u = (status || "").toUpperCase()
    if (u === "ACTIVE" || u === "EN CAMINO PARA PICKUP" || u === "ARRIVED")
      return "success"
    if (u === "PENDING" || u === "PENDIENTE") return "warning"
    if (u === "DELIVERED" || u === "ENTREGADO") return "success"
    return undefined
  }

  const getDriverDisplay = (driverId?: number | null): string => {
    if (!driverId) return "—"
    return driversMap[driverId] || `Driver ${driverId}`
  }

  const getDeliveredByDisplay = (id?: number | null): string => {
    if (!id) return "—"
    if (driversMap[id]) return driversMap[id]
    if (usersMap[id]) return usersMap[id]
    return `ID ${id}`
  }

  const rowWarnings = (s: Shipment) => {
    const st = (s.shipment_status || "").toString().toUpperCase()
    const deliveredButNoDeliveredAt =
      (st === "DELIVERED" || st === "ENTREGADO") && !s.delivered_at
    const activeButNoDriver =
      (st === "ACTIVE" || st === "EN CAMINO PARA PICKUP" || st === "ARRIVED") &&
      !s.shipment_driver
    return { deliveredButNoDeliveredAt, activeButNoDriver }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] relative">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
          <Select
            label="Filtrar por estado"
            value={statusFilter}
            onChange={(value: string) => setStatusFilter(value)}
            options={[{ value: "", label: "Todos" }, ...statusOptions]}
          />

          <Select
            label="Filtrar por destino"
            value={provinceFilter}
            onChange={(value: string) => setProvinceFilter(value)}
            options={[
              { value: "", label: "Todos" },
              ...allProvinces.map((p) => ({
                value: String(p.id),
                label: p.province_name,
              })),
            ]}
          />
        </div>

        {/* Desktop */}
        <div
          className={`hidden md:block max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {!filteredShipments.length ? (
            <div className="text-center text-gray-500 dark:text-white/70 p-8">
              No hay envíos registrados
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Código
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Fecha
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Estado
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Pickup
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Delivery
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Remitente
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Conductor
                  </TableCell>

                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Distancia
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Actualizado
                  </TableCell>

                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredShipments.map((s) => {
                  const w = rowWarnings(s)
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {s.shipment_code}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {formatDate(s.shipment_date)}
                      </TableCell>

                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge size="sm" color={badgeColor(s.shipment_status)}>
                            {s.shipment_status}
                          </Badge>
                          {(w.deliveredButNoDeliveredAt || w.activeButNoDriver) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-200 dark:border-yellow-400/20">
                              ⚠
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {originLabel(s)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {destLabel(s)}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {s.shipment_sender_name}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {getDriverDisplay(s.shipment_driver ?? null)}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {km(s.shipment_distance_km)}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {s.updated_at ? formatDateTime(s.updated_at) : "—"}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-start">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsDetailsOpen(true)
                              setSelectedShipment(s)
                            }}
                            aria-label="Ver detalles"
                            className="p-2"
                          >
                            <HiEye className="w-4 h-4" />
                          </Button>

                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={mapsHref(mapsFromValue(s), mapsToValue(s))}
                          >
                            <Button size="sm" variant="outline" className="p-2" aria-label="Ver en Maps">
                              <HiMap className="w-4 h-4" />
                            </Button>
                          </a>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteShipment(s.id)}
                            aria-label="Eliminar"
                            className="p-2"
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Mobile */}
        <div
          className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {!filteredShipments.length ? (
            <div className="text-center text-gray-500 dark:text-white/70">
              No hay envíos registrados
            </div>
          ) : (
            filteredShipments.map((s) => {
              const w = rowWarnings(s)
              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-gray-700 dark:text-white">
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        {s.shipment_code}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {formatDate(s.shipment_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge size="sm" color={badgeColor(s.shipment_status)}>
                        {s.shipment_status}
                      </Badge>
                      {(w.deliveredButNoDeliveredAt || w.activeButNoDriver) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-200 dark:border-yellow-400/20">
                          ⚠
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-white text-sm mt-1">
                    <strong>Pickup:</strong> {originLabel(s)}
                  </p>
                  <p className="text-gray-700 dark:text-white text-sm">
                    <strong>Delivery:</strong> {destLabel(s)}
                  </p>

                  <p className="text-gray-700 dark:text-white text-sm">
                    <strong>Remitente:</strong> {s.shipment_sender_name}
                  </p>

                  <p className="text-gray-700 dark:text-white text-sm">
                    <strong>Conductor:</strong> {getDriverDisplay(s.shipment_driver ?? null)}
                  </p>

                  <p className="text-gray-700 dark:text-white text-sm">
                    <strong>Distancia:</strong> {km(s.shipment_distance_km)}
                  </p>

                  <p className="text-gray-700 dark:text-white text-sm">
                    <strong>Actualizado:</strong> {s.updated_at ? formatDateTime(s.updated_at) : "—"}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsDetailsOpen(true)
                        setSelectedShipment(s)
                      }}
                      aria-label="Ver detalles"
                      className="p-2 flex-1"
                    >
                      <HiEye className="w-4 h-4" />
                    </Button>

                    <a
                      className="flex-1"
                      target="_blank"
                      rel="noreferrer"
                      href={mapsHref(mapsFromValue(s), mapsToValue(s))}
                    >
                      <Button size="sm" variant="outline" className="p-2 w-full">
                        <HiMap className="w-4 h-4" />
                      </Button>
                    </a>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteShipment(s.id)}
                      aria-label="Eliminar"
                      className="p-2"
                    >
                      <HiTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal Detalles (componente separado) */}
      <ShipmentDetailsModal
        open={isDetailsOpen}
        onClose={() => closeDetails()}
        shipment={selectedShipment}
        getProvinceName={(id) => provinces[Number(id)] || "Desconocido"}
        getUserDisplay={(uid) => usersMap[uid] || `Usuario ${uid}`}
        getDriverDisplay={(did) => (did ? driversMap[did] || `Driver ${did}` : "—")}
        getDeliveredByDisplay={(id) => getDeliveredByDisplay(id)}
        onDeleteShipment={deleteShipment}
      />
    </>
  )
}
