import PageMeta from "../../components/common/PageMeta"
import { useEffect, useState } from "react"
import { getUser } from "../../utils/common"
import { useNavigate } from "react-router-dom"
import axios from "axios"

interface CommonUser {
  id: number
  user_firstname: string
  user_lastname: string
  user_email: string
  user_phonenumber: string
  user_province: string | number
  user_prefix: string
  user_address: string | number
}

interface PackageRow {
  id: number
  status_name: string
  created_at?: string
  package_tracking_id?: string
  user_fullname?: string
}

interface DriverRow {
  id: number
}

interface UserRow {
  id: number
  user_firstname: string
  user_lastname: string
  user_email: string
}

const apiUrl = import.meta.env.VITE_API_URL || ""

function formatDate(dateString?: string) {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getStatusColor(status: string | undefined) {
  const st = (status || "").toUpperCase()
  if (st === "ENTREGADO")
    return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
  if (st === "EN TRANSITO A MIAMI" || st === "EN TRANSITO A PANAMA")
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
  if (st === "POR CONFIRMAR")
    return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
  return "bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-white/80"
}

export default function Home() {
  const navigate = useNavigate()

  const [user, setUser] = useState<CommonUser | null>(null)

  const [paquetesMiami, setPaquetesMiami] = useState<number>(0)
  const [paquetesAlertados, setPaquetesAlertados] = useState<number>(0)
  const [paquetesPanama, setPaquetesPanama] = useState<number>(0)

  const [, setTotalClientes] = useState<number>(0)
  const [totalPaquetes, setTotalPaquetes] = useState<number>(0)

  const [hayPorConfirmar, setHayPorConfirmar] = useState<boolean>(false)

  const [recentPackages, setRecentPackages] = useState<PackageRow[]>([])

  useEffect(() => {
    const currentUser = getUser() as CommonUser | null
    if (currentUser) {
      setUser(currentUser)
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token")

        const [packagesRes, driversRes, usersRes] = await Promise.all([
          axios.get<PackageRow[]>(`${apiUrl}/packages/packages/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<DriverRow[]>(`${apiUrl}/drivers/drivers/all`),
          axios.get<UserRow[]>(`${apiUrl}/users/users/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const packages = Array.isArray(packagesRes.data) ? packagesRes.data : []
        const drivers = Array.isArray(driversRes.data) ? driversRes.data : []
        const users = Array.isArray(usersRes.data) ? usersRes.data : []

        // PAQUETES EN MIAMI (RECIBIDO(S) EN MIAMI)
        const miamiCount = packages.filter((p) => {
          const st = (p.status_name || "").toUpperCase()
          return st === "RECIBIDO EN MIAMI" || st === "RECIBIDOS EN MIAMI"
        }).length

        // PAQUETES ALERTADOS (POR CONFIRMAR)
        const alertadosCount = packages.filter(
          (p) => (p.status_name || "").toUpperCase() === "POR CONFIRMAR",
        ).length

        // PAQUETES EN PANAMÁ (RECIBIDO(S) EN PANAMA)
        const panamaCount = packages.filter((p) => {
          const st = (p.status_name || "").toUpperCase()
          return st === "RECIBIDO EN PANAMA" || st === "RECIBIDOS EN PANAMA"
        }).length

        const existePorConfirmar = alertadosCount > 0

        drivers.length
        const totalUsers = users.length
        const totalPacks = packages.length

        const sortedRecent = [...packages]
          .sort((a, b) => {
            const da = new Date(a.created_at || 0).getTime()
            const db = new Date(b.created_at || 0).getTime()
            return db - da
          })
          .slice(0, 5)

        setPaquetesMiami(miamiCount)
        setPaquetesAlertados(alertadosCount)
        setPaquetesPanama(panamaCount)

        setTotalClientes(totalUsers)
        setTotalPaquetes(totalPacks)

        setHayPorConfirmar(existePorConfirmar)
        setRecentPackages(sortedRecent)
      } catch (err) {
        console.error("Error cargando datos del dashboard:", err)

        setPaquetesMiami(0)
        setPaquetesAlertados(0)
        setPaquetesPanama(0)
        setTotalClientes(0)
        setTotalPaquetes(0)
        setHayPorConfirmar(false)
        setRecentPackages([])
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <>
      <PageMeta title="Panel Operativo - Get" description="Dashboard administrativo y métricas operativas" />

      <div className="p-4 md:p-6 flex flex-col gap-6">
        {/* HEADER SUPERIOR */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
              {user ? `Hola, ${user.user_firstname}` : "Hola 👋"}
            </h1>
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/packages")}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
            >
              Paquetes
            </button>
            <button
              onClick={() => navigate("/shipments")}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
            >
              Envios
            </button>
          </div>
        </header>

        {/* KPIs PRINCIPALES EN DOS COLUMNAS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PAQUETES EN MIAMI */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60 uppercase tracking-wide">
              Paquetes en Miami
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{paquetesMiami}</p>
            <p className="text-[13px] text-gray-500 dark:text-white/50 mt-1">
              Paquetes recibidos en el warehouse de Miami
            </p>
          </div>

          {/* PAQUETES ALERTADOS (POR CONFIRMAR) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60 uppercase tracking-wide">
              Paquetes Alertados
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{paquetesAlertados}</p>
            <p className="text-[13px] text-gray-500 dark:text-white/50 mt-1">
              Paquetes con estado &quot;POR CONFIRMAR&quot;
            </p>
          </div>

          {/* PAQUETES EN PANAMÁ */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60 uppercase tracking-wide">
              Paquetes en Panamá
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{paquetesPanama}</p>
            <p className="text-[13px] text-gray-500 dark:text-white/50 mt-1">
              Paquetes recibidos en Panamá pendientes de entrega
            </p>
          </div>
        </section>

        {/* ALERTA OPERATIVA (solo si hay POR CONFIRMAR) */}
        {hayPorConfirmar && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Atención requerida</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Tienes paquetes &quot;POR CONFIRMAR&quot;. Revísalos para evitar retrasos.
                </p>
              </div>

              <button
                onClick={() => navigate("/packages?status=POR%20CONFIRMAR")}
                className="self-start whitespace-nowrap rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black"
              >
                Ver pendientes
              </button>
            </div>
          </section>
        )}

        {/* ACTIVIDAD RECIENTE */}
        {totalPaquetes > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h2>
                <p className="text-sm text-gray-500 dark:text-white/50">Últimos movimientos de paquetes</p>
              </div>

              <button
                onClick={() => navigate("/packages")}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Ver todo →
              </button>
            </div>

            {recentPackages.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-white/50">No hay actividad reciente.</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-white/[0.07]">
                {recentPackages.map((pkg) => (
                  <li
                    key={pkg.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                        <span className="truncate max-w-[200px]">
                          {pkg.package_tracking_id || "Sin tracking"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusColor(
                            pkg.status_name,
                          )}`}
                        >
                          {pkg.status_name || "SIN ESTADO"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {pkg.user_fullname || "Cliente desconocido"}
                      </p>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-white/50 text-left sm:text-right">
                      <div className="font-medium text-gray-700 dark:text-white">
                        {formatDate(pkg.created_at)}
                      </div>
                      <button
                        onClick={() => navigate(`/packages/edit/${pkg.id}`)}
                        className="mt-1 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Gestionar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  )
}
