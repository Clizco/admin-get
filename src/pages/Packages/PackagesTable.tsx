// === IMPORTS ORIGINALES ===
import { useEffect, useState, ChangeEvent, useMemo } from "react"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import Button from "../../components/ui/button/Button"
import Badge from "../../components/ui/badge/Badge"
import { useNavigate } from "react-router-dom"
import { HiTrash, HiPencil, HiChevronUp, HiChevronDown } from "react-icons/hi"
import Select from "../../components/form/Select"

// === IMPORTS NUEVOS (HISTORIAL + REALTIME) ===
import { usePackageRealtime } from "../../hooks/usePackageRealtime"
import Modal from "../../components/Modals/Modal"
import PackageTimeline from "../../components/Timelines/PackageTimeline"

interface Product {
  id: number
  product_weight: string
  product_unit: string
  product_description: string
  product_value: string
  product_store: string
}

interface Package {
  id: number
  package_tracking_id: string
  status_name: string
  created_at: string
  products: Product[]
  user_id: number
  user_firstname: string
  user_lastname: string
  user_email: string
  user_prefix: string
  user_fullname: string
}

type SortKey = "created_at" | "user_fullname"
type SortDirection = "asc" | "desc"

const apiUrl = import.meta.env.VITE_API_URL || ""

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const getStatusColor = (
  status: string
): "success" | "warning" | "error" | undefined => {
  switch (status.toUpperCase()) {
    case "ENTREGADO":
      return "success"
    case "EN TRANSITO A MIAMI":
    case "EN TRANSITO A PANAMA":
      return "warning"
    case "POR CONFIRMAR":
      return "error"
    default:
      return undefined
  }
}

export default function PackageTableAdmin() {
  const [packages, setPackages] = useState<Package[]>([])
  const [filter, setFilter] = useState("")
  const [statuses, setStatuses] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("Todos")
  const [search, setSearch] = useState<string>("")
  const navigate = useNavigate()

  // --- Ordenamiento ---
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // --- Historial (modal) ---
  const [openTimeline, setOpenTimeline] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null)

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get<Package[]>(
        `${apiUrl}/packages/packages/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setPackages(response.data)
    } catch (error) {
      console.error("Error fetching package data:", error)
    }
  }

  const fetchStatuses = async () => {
    try {
      const response = await axios.get(`${apiUrl}/packages/statuses`)
      setStatuses(["Todos", ...response.data.map((s: any) => s.status_name)])
    } catch (err) {
      console.error("Error obteniendo estados:", err)
    }
  }

  const handleEdit = (packageId: number) => {
    navigate(`/packages/edit/${packageId}`)
  }

  const handleDelete = async (packageId: number) => {
    const pkg = packages.find((p) => p.id === packageId)
    const label = pkg?.package_tracking_id
      ? ` (${pkg.package_tracking_id})`
      : ""

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar este paquete${label}?`
    )
    if (!confirmed) return

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${apiUrl}/packages/packages/delete/${packageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setPackages((prev) => prev.filter((pkg) => pkg.id !== packageId))
    } catch (error) {
      console.error("Error eliminando paquete:", error)
      alert("Ocurrió un error al eliminar el paquete.")
    }
  }

  useEffect(() => {
    fetchPackages()
    fetchStatuses()
  }, [])

  // 🔴 REALTIME: se refresca sola la tabla cuando cambie un paquete
  usePackageRealtime(() => {
    console.log("📡 Actualización recibida → Refrescando paquetes")
    fetchPackages()
  })

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesStatus =
        selectedStatus === "Todos" || pkg.status_name === selectedStatus
      const matchesSearch = pkg.package_tracking_id
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesFilter =
        pkg.user_fullname.toLowerCase().includes(filter.toLowerCase()) ||
        pkg.user_email.toLowerCase().includes(filter.toLowerCase()) ||
        (pkg.user_prefix || "").toLowerCase().includes(filter.toLowerCase())

      return matchesStatus && matchesSearch && matchesFilter
    })
  }, [packages, selectedStatus, search, filter])

  const sortedPackages = useMemo(() => {
    if (!sortKey) return filteredPackages

    const sorted = [...filteredPackages].sort((a, b) => {
      if (sortKey === "created_at") {
        const at = new Date(a.created_at).getTime()
        const bt = new Date(b.created_at).getTime()
        return sortDirection === "asc" ? at - bt : bt - at
      }
      // user_fullname
      return sortDirection === "asc"
        ? a.user_fullname.localeCompare(b.user_fullname, "es", {
            sensitivity: "base",
          })
        : b.user_fullname.localeCompare(a.user_fullname, "es", {
            sensitivity: "base",
          })
    })

    return sorted
  }, [filteredPackages, sortKey, sortDirection])

  const handleSortToggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const SortIndicator = ({ active }: { active: boolean }) => {
    if (!active) return null
    return sortDirection === "asc" ? (
      <HiChevronUp className="w-4 h-4" />
    ) : (
      <HiChevronDown className="w-4 h-4" />
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filtros */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por cliente o email
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={filter}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFilter(e.target.value)
            }
            className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Buscar por Tracking ID
          </label>
          <input
            type="text"
            placeholder="Ej: 123ABC456"
            className="w-full p-2 border rounded-md dark:bg-white/[0.02] dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por estado
          </label>
          <Select
            className="w-full p-2 border rounded-md dark:bg-white/[0.02] dark:text-white"
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            options={statuses.map((status) => ({
              value: status,
              label: status,
            }))}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => handleSortToggle("created_at")}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  title="Ordenar por fecha de creación"
                >
                  Creado
                  <SortIndicator active={sortKey === "created_at"} />
                </button>
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
              >
                Tracking
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
              >
                Estado
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => handleSortToggle("user_fullname")}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  title="Ordenar por cliente"
                >
                  Cliente
                  <SortIndicator active={sortKey === "user_fullname"} />
                </button>
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
              >
                Acciones
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {sortedPackages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                  {formatDate(pkg.created_at)}
                </TableCell>
                <TableCell className="px-5 py-3 text-blue-600 dark:text-blue-400 font-medium">
                  {pkg.package_tracking_id}
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                  <Badge size="sm" color={getStatusColor(pkg.status_name)}>
                    {pkg.status_name}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">
                  <button
                    onClick={() => navigate(`/users/${pkg.user_id}`)}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {pkg.user_fullname}
                  </button>
                </TableCell>

                <TableCell className="px-5 py-3 text-start">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Historial */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPackageId(pkg.id)
                        setOpenTimeline(true)
                      }}
                    >
                      Historial
                    </Button>

                    {/* Edit (ícono) */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(pkg.id)}
                      aria-label="Editar"
                      className="p-2"
                    >
                      <HiPencil className="w-4 h-4" />
                      <span className="sr-only">Editar</span>
                    </Button>

                    {/* Delete (ícono) */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(pkg.id)}
                      aria-label="Eliminar"
                      className="p-2"
                    >
                      <HiTrash className="w-4 h-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --- MOBILE: barra de orden + cards --- */}
      <div className="md:hidden px-4 pt-2 pb-3 sticky top-0 bg-white/90 dark:bg-black/50 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSortToggle("created_at")}
            className={`flex-1 text-sm px-3 py-2 rounded-md border transition
              ${
                sortKey === "created_at"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200"
              }`}
            title="Ordenar por Fecha"
          >
            Fecha{" "}
            {sortKey === "created_at" &&
              (sortDirection === "asc" ? "↑" : "↓")}
          </button>

          <button
            onClick={() => handleSortToggle("user_fullname")}
            className={`flex-1 text-sm px-3 py-2 rounded-md border transition
              ${
                sortKey === "user_fullname"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200"
              }`}
            title="Ordenar por Cliente"
          >
            Cliente{" "}
            {sortKey === "user_fullname" &&
              (sortDirection === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden p-4 space-y-4">
        {sortedPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white dark:bg.white/5 border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm"
          >
            <p
              className="text-sm text-gray-600 dark:text-gray-300 active:opacity-70"
              role="button"
              title="Tocar para ordenar por fecha"
              onClick={() => handleSortToggle("created_at")}
            >
              <strong>Fecha:</strong> {formatDate(pkg.created_at)}
            </p>

            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              <strong>Tracking:</strong> {pkg.package_tracking_id}
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Estado:</strong>{" "}
              <Badge size="sm" color={getStatusColor(pkg.status_name)}>
                {pkg.status_name}
              </Badge>
            </p>

            <p
              className="text-sm text-gray-600 dark:text-gray-300 active:opacity-70"
              role="button"
              title="Tocar para ordenar por cliente"
              onClick={() => handleSortToggle("user_fullname")}
            >
              <strong>Cliente:</strong>{" "}
              <button
                onClick={() => navigate(`/users/${pkg.user_id}`)}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {pkg.user_fullname}
              </button>
            </p>

            <div className="mt-3 flex gap-2 flex-wrap">
              {/* Historial */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedPackageId(pkg.id)
                  setOpenTimeline(true)
                }}
              >
                Historial
              </Button>

              {/* Edit (ícono) */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(pkg.id)}
                aria-label="Editar"
                className="p-2"
              >
                <HiPencil className="w-4 h-4" />
                <span className="sr-only">Editar</span>
              </Button>

              {/* Delete (ícono) */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(pkg.id)}
                aria-label="Eliminar"
                className="p-2"
              >
                <HiTrash className="w-4 h-4" />
                <span className="sr-only">Eliminar</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE TIMELINE */}
      <Modal
        open={openTimeline}
        onClose={() => setOpenTimeline(false)}
        title="Historial del Paquete"
      >
        {selectedPackageId && (
          <PackageTimeline packageId={selectedPackageId} />
        )}
      </Modal>
    </div>
  )
}
