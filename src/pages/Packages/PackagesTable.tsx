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

// === IMPORTS NUEVOS ===
import { usePackageRealtime } from "../../hooks/usePackageRealtime"
import Modal from "../../components/Modal"
import PackageTimeline from "../../components/PackageTimeline"

// === INTERFACES ORIGINALES ===
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

type SortKey = "created_at" | "user_fullname" | "status_name"
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

  // === NUEVO: Estado del modal de historial ===
  const [openTimeline, setOpenTimeline] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null)

  // === Ordenamiento ===
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

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
    const label = pkg?.package_tracking_id ? ` (${pkg.package_tracking_id})` : ""
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

  // === REALTIME: Se refresca la tabla sola cuando cambia un paquete ===
  usePackageRealtime(() => {
    console.log("📡 Actualización recibida → Refrescando paquetes")
    fetchPackages()
  })

  const filteredPackages = useMemo(() => {
    const f = filter.toLowerCase()
    const s = search.toLowerCase()

    return packages.filter((pkg) => {
      const matchesStatus =
        selectedStatus === "Todos" || pkg.status_name === selectedStatus

      const matchesSearch = pkg.package_tracking_id
        .toLowerCase()
        .includes(s)

      const matchesFilter =
        pkg.user_fullname.toLowerCase().includes(f) ||
        pkg.user_email.toLowerCase().includes(f) ||
        (pkg.user_prefix || "").toLowerCase().includes(f)

      return matchesStatus && matchesSearch && matchesFilter
    })
  }, [packages, selectedStatus, search, filter])

  const sortedPackages = useMemo(() => {
    return [...filteredPackages].sort((a, b) => {
      if (sortKey === "created_at") {
        const at = new Date(a.created_at).getTime()
        const bt = new Date(b.created_at).getTime()
        return sortDirection === "asc" ? at - bt : bt - at
      }
      if (sortKey === "user_fullname") {
        return sortDirection === "asc"
          ? a.user_fullname.localeCompare(b.user_fullname)
          : b.user_fullname.localeCompare(a.user_fullname)
      }
      const sa = a.status_name ?? ""
      const sb = b.status_name ?? ""
      return sortDirection === "asc"
        ? sa.localeCompare(sb)
        : sb.localeCompare(sa)
    })
  }, [filteredPackages, sortKey, sortDirection])

  const handleSortToggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection(key === "created_at" ? "desc" : "asc")
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
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-white/[0.03]">
      {/* Filtros */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
            Filtrar por cliente o email
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={filter}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFilter(e.target.value)
            }
            className="w-full p-2 border rounded-md dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
            Buscar por Tracking ID
          </label>
          <input
            type="text"
            placeholder="Ej: 123ABC456"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className="w-full p-2 border rounded-md dark:text-white dark:bg-neutral-900"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
            Filtrar por estado
          </label>
          <Select
            className="w-full p-2 border rounded-md dark:bg-neutral-900 dark:text-white"
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            options={statuses.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>
                <button
                  onClick={() => handleSortToggle("created_at")}
                  className="flex items-center gap-1"
                >
                  Creado <SortIndicator active={sortKey === "created_at"} />
                </button>
              </TableCell>

              <TableCell isHeader>Tracking</TableCell>

              <TableCell isHeader>
                <button
                  onClick={() => handleSortToggle("status_name")}
                  className="flex items-center gap-1"
                >
                  Estado <SortIndicator active={sortKey === "status_name"} />
                </button>
              </TableCell>

              <TableCell isHeader>
                <button
                  onClick={() => handleSortToggle("user_fullname")}
                  className="flex items-center gap-1"
                >
                  Cliente <SortIndicator active={sortKey === "user_fullname"} />
                </button>
              </TableCell>

              <TableCell isHeader>Acciones</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedPackages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>{formatDate(pkg.created_at)}</TableCell>
                <TableCell className="text-blue-600">
                  {pkg.package_tracking_id}
                </TableCell>
                <TableCell>
                  <Badge size="sm" color={getStatusColor(pkg.status_name)}>
                    {pkg.status_name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => navigate(`/users/${pkg.user_id}`)}
                  >
                    {pkg.user_fullname}
                  </button>
                </TableCell>

                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {/* Nueva acción: Ver Historial */}
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

                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(pkg.id)}
                      className="p-2"
                    >
                      <HiPencil className="w-4 h-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(pkg.id)}
                      className="p-2"
                    >
                      <HiTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE CARDS */}
      <div className="block md:hidden p-4 space-y-4">
        {sortedPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white dark:bg-neutral-900 border rounded-lg p-3 shadow"
          >
            <p>
              <strong>Fecha:</strong> {formatDate(pkg.created_at)}
            </p>
            <p>
              <strong>Tracking:</strong> {pkg.package_tracking_id}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              <Badge size="sm" color={getStatusColor(pkg.status_name)}>
                {pkg.status_name}
              </Badge>
            </p>
            <p>
              <strong>Cliente:</strong>{" "}
              <button
                onClick={() => navigate(`/users/${pkg.user_id}`)}
                className="text-blue-600 hover:underline"
              >
                {pkg.user_fullname}
              </button>
            </p>

            <div className="flex gap-2 mt-3">
              {/* Ver Historial */}
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

              {/* Edit */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(pkg.id)}
                className="p-2"
              >
                <HiPencil className="w-4 h-4" />
              </Button>

              {/* Delete */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(pkg.id)}
                className="p-2"
              >
                <HiTrash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* === MODAL DE TIMELINE === */}
      <Modal
        open={openTimeline}
        onClose={() => setOpenTimeline(false)}
        title="Historial del Paquete"
      >
        {selectedPackageId && <PackageTimeline packageId={selectedPackageId} />}
      </Modal>
    </div>
  )
}
