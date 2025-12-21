import { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Transaction {
  id: number
  created_at: string
  category: "Paquetes" | "Envios" | "Promociones" | string
  amount: number
  description?: string | null
  driver_id?: number | null
  source_table?: string | null
  source_id?: number | null
}

interface Driver {
  id: number
  driver_name?: string | null
  driver_lastname?: string | null
}

const apiUrl = import.meta.env.VITE_API_URL || ""
const transactionsUrl = `${apiUrl}/transactions/transactions/all`

// ✅ Tu backend: driverRouter.get("/drivers/:id")
const driversBaseUrl = `${apiUrl}/drivers/drivers`  

// 🕒 Fecha más legible (sin romper estilos)
const formatDateTime = (raw: string): string => {
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return "Fecha inválida"

  return new Intl.DateTimeFormat("es-PA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

// 📅 Rango: 01 del mes → hoy
const isInCurrentMonthWindow = (raw: string): boolean => {
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return false

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return d >= startOfMonth && d <= now
}

export default function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fade, setFade] = useState(false)

  // ✅ Cache de conductores (ID -> Driver)
  const [driversById, setDriversById] = useState<Record<number, Driver>>({})

  // ✅ Evita pedir el mismo conductor varias veces mientras carga
  const requestedDriversRef = useRef<Set<number>>(new Set())

  const navigate = useNavigate()

  // ✅ Carga conductor por id: GET /drivers/:id
  const loadDriverIfNeeded = async (driverId?: number | null) => {
    if (!driverId) return
    if (driversById[driverId]) return
    if (requestedDriversRef.current.has(driverId)) return

    requestedDriversRef.current.add(driverId)

    try {
      const { data } = await axios.get<Driver>(`${driversBaseUrl}/${driverId}`)

      setDriversById((prev) => ({
        ...prev,
        [driverId]: data,
      }))
    } catch (error) {
      console.warn(`No se pudo cargar conductor ${driverId}`, error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get<Transaction[]>(transactionsUrl)
        const rows = Array.isArray(data) ? data : []

        setTransactions(rows)

        // ✅ Precarga de conductores usados en transacciones
        for (const tx of rows) {
          if (tx.driver_id) {
            loadDriverIfNeeded(tx.driver_id)
          }
        }

        setTimeout(() => setFade(true), 50)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }

    setFade(false)
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [transactions])

  // KPIs del mes
  let ingresosTotal = 0
  let debitosTotal = 0

  for (const t of transactions) {
    if (!isInCurrentMonthWindow(t.created_at)) continue
    if (t.amount > 0) ingresosTotal += t.amount
    else if (t.amount < 0) debitosTotal += Math.abs(t.amount)
  }

  const formatMoney = (value: number) =>
    value.toLocaleString("es-PA", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    })

  // ✅ MISMA FUNCIÓN, MISMO LUGAR EN TU JSX
  // Solo que ahora si existe el conductor, muestra su nombre, si no -> #id
  const formatDriverId = (driverId?: number | null) => {
    if (!driverId) return "—"

    const d = driversById[driverId]
    if (!d) return `#${driverId}`

    const fullName = [d.driver_name, d.driver_lastname].filter(Boolean).join(" ")
    return fullName || `#${driverId}`
  }

  return (
    <div className="relative">
      {/* 🔙 Flecha solo en mobile */}
      <div className="flex items-center gap-3 mb-4 px-1 md:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-full p-1.5 
          hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-white transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Transacciones
        </h1>
      </div>

      {/* CARD PRINCIPAL */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* HEADER + KPIs */}
        <div className="p-4 border-b border-gray-100 dark:border-white/[0.05] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">
              Transacciones
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Resumen de ingresos y débitos generados por envíos, paquetes y promociones
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[260px] md:min-w-[360px]">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-500/40 dark:bg-emerald-900/20">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Ingresos (desde el 01)
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                {formatMoney(ingresosTotal)}
              </p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm dark:border-rose-500/40 dark:bg-rose-900/20">
              <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                Débitos (desde el 01)
              </p>
              <p className="mt-1 text-lg font-semibold text-rose-900 dark:text-rose-100">
                {formatMoney(debitosTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* TABLA DESKTOP */}
        <div
          className={`hidden md:block max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {sortedTransactions.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-white/70 p-8">
              No hay transacciones registradas
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Fecha
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Categoría
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Conductor
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">
                    Descripción
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-end text-sm text-gray-500 font-medium dark:text-gray-400">
                    Débito
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-end text-sm text-gray-500 font-medium dark:text-gray-400">
                    Crédito
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {sortedTransactions.map((tx) => {
                  const isCredit = tx.amount > 0
                  const isDebit = tx.amount < 0

                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {formatDateTime(tx.created_at)}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {tx.category}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                        {formatDriverId(tx.driver_id)}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-white/80">
                        {tx.description || "—"}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-right">
                        {isDebit ? (
                          <span className="font-medium text-rose-600 dark:text-rose-400">
                            -{formatMoney(Math.abs(tx.amount))}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-3 text-sm text-right">
                        {isCredit ? (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            +{formatMoney(tx.amount)}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* MOBILE CARDS */}
        <div
          className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {sortedTransactions.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-white/70">
              No hay transacciones registradas
            </div>
          ) : (
            sortedTransactions.map((tx) => {
              const isCredit = tx.amount > 0
              const isDebit = tx.amount < 0

              return (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-white/5 border border-gray-200 
                  dark:border-white/[0.05] rounded-xl p-4 shadow-sm space-y-1"
                >
                  <p className="text-sm text-gray-700 dark:text-white">
                    <strong>Fecha:</strong> {formatDateTime(tx.created_at)}
                  </p>

                  <p className="text-sm text-gray-700 dark:text-white">
                    <strong>Categoría:</strong> {tx.category}
                  </p>

                  <p className="text-sm text-gray-700 dark:text-white">
                    <strong>Conductor:</strong> {formatDriverId(tx.driver_id)}
                  </p>

                  {tx.description && (
                    <p className="text-sm text-gray-700 dark:text-white">
                      <strong>Detalle:</strong> {tx.description}
                    </p>
                  )}

                  <p className="text-sm">
                    <strong>Débito:</strong>{" "}
                    {isDebit ? (
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        -{formatMoney(Math.abs(tx.amount))}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </p>

                  <p className="text-sm">
                    <strong>Crédito:</strong>{" "}
                    {isCredit ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatMoney(tx.amount)}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
