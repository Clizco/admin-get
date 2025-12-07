import { useEffect, useState } from "react"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table"


interface Transaction {
  id: number
  created_at: string // timestamp de la BD
  category: "Paquetes" | "Envios" | "Promociones" | string
  amount: number // + crédito / - débito
}

const apiUrl = import.meta.env.VITE_API_URL || ""
const transactionsUrl = `${apiUrl}/transactions/transactions/all`

// 🕒 Formatear fecha: "06/12/25 02:35 PM"
const formatDateTime = (raw: string): string => {
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return "Fecha inválida"

  const dia = String(date.getDate()).padStart(2, "0")
  const mes = String(date.getMonth() + 1).padStart(2, "0")
  const anoCorto = String(date.getFullYear()).slice(-2)

  let horas = date.getHours()
  const minutos = String(date.getMinutes()).padStart(2, "0")
  const ampm = horas >= 12 ? "PM" : "AM"
  horas = horas % 12
  if (horas === 0) horas = 12
  const horasStr = String(horas).padStart(2, "0")

  return `${dia}/${mes}/${anoCorto} ${horasStr}:${minutos} ${ampm}`
}

// 📅 Rango: desde el 01 del mes actual hasta hoy
const isInCurrentMonthWindow = (raw: string): boolean => {
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return false

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

  return d >= startOfMonth && d <= now
}

export default function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get<Transaction[]>(transactionsUrl)
        setTransactions(Array.isArray(data) ? data : [])
        setTimeout(() => setFade(true), 50)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }

    setFade(false)
    fetchData()
  }, [])

  // Ordenar por fecha descendente
  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // KPI: Ingresos y Débitos en el rango (01 del mes → hoy)
  let ingresosTotal = 0
  let debitosTotal = 0

  for (const t of transactions) {
    if (!isInCurrentMonthWindow(t.created_at)) continue
    if (t.amount > 0) {
      ingresosTotal += t.amount
    } else if (t.amount < 0) {
      debitosTotal += Math.abs(t.amount) // sumamos como valor positivo
    }
  }

  const formatMoney = (value: number) =>
    value.toLocaleString("es-PA", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    })

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* HEADER + KPIs */}
      <div className="p-4 border-b border-gray-100 dark:border-white/[0.05] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Transacciones
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Resumen de ingresos y débitos generados por envíos, paquetes,
            promociones y comisiones
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[260px] md:min-w-[360px]">
          {/* KPI Ingresos */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-500/40 dark:bg-emerald-900/20">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Ingresos (desde el 01)
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
              {formatMoney(ingresosTotal)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-200/80">
              Suma de todos los créditos registrados desde el inicio del mes
            </p>
          </div>

          {/* KPI Débitos */}
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm dark:border-rose-500/40 dark:bg-rose-900/20">
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
              Débitos (desde el 01)
            </p>
            <p className="mt-1 text-lg font-semibold text-rose-900 dark:text-rose-100">
              {formatMoney(debitosTotal)}
            </p>
            <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-200/80">
              Suma de todos los débitos registrados desde el inicio del mes
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
            No hay transacciones registradas.
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Fecha
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Categoría
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-end text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Débito
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-end text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Crédito
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {sortedTransactions.map((tx) => {
                const isCredit = tx.amount > 0
                const isDebit = tx.amount < 0
                const debitValue = isDebit ? Math.abs(tx.amount) : 0
                const creditValue = isCredit ? tx.amount : 0

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                      {formatDateTime(tx.created_at)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                      {tx.category}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-right">
                      {isDebit ? (
                        <span className="font-medium text-rose-600 dark:text-rose-400">
                          -{formatMoney(debitValue)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-right">
                      {isCredit ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          +{formatMoney(creditValue)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          —
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* VISTA MÓVIL: tarjetas */}
      <div
        className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {sortedTransactions.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70">
            No hay transacciones registradas.
          </div>
        ) : (
          sortedTransactions.map((tx) => {
            const isCredit = tx.amount > 0
            const isDebit = tx.amount < 0
            const debitValue = isDebit ? Math.abs(tx.amount) : 0
            const creditValue = isCredit ? tx.amount : 0

            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm space-y-1"
              >
                <p className="text-sm text-gray-700 dark:text-white">
                  <strong>Fecha:</strong> {formatDateTime(tx.created_at)}
                </p>
                <p className="text-sm text-gray-700 dark:text-white">
                  <strong>Categoría:</strong> {tx.category}
                </p>
                <p className="text-sm">
                  <strong>Débito:</strong>{" "}
                  {isDebit ? (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      -{formatMoney(debitValue)}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </p>
                <p className="text-sm">
                  <strong>Crédito:</strong>{" "}
                  {isCredit ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatMoney(creditValue)}
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
  )
}
