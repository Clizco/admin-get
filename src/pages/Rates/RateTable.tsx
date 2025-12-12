// src/views/rates/RateTable.tsx
import { useState, useEffect, ReactNode } from "react"
import axios from "axios"
import { ChevronDown } from "lucide-react"
import PageMeta from "../../components/common/PageMeta"
import Button from "../../components/ui/button/Button"

interface RateRow {
  label: string
  price: string
  note?: string
}

// Ejemplos de datos (puedes cambiarlos luego o traerlos de la API)
const shippingRates: RateRow[] = [
  { label: "Envío urbano", price: "$4.99", note: "Dentro de la ciudad" },
  { label: "Envío interurbano", price: "$6.99", note: "Entre provincias cercanas" },
  { label: "Envío nacional", price: "$8.99", note: "Cobertura nacional" },
  { label: "Servicio express", price: "+20%", note: "Recargo sobre la tarifa base" },
]

const packageRates: RateRow[] = [
  { label: "0 - 1 lb", price: "$3.50" },
  { label: "1 - 5 lb", price: "$5.90" },
  { label: "5 - 10 lb", price: "$9.50" },
  { label: "+10 lb", price: "Según cotización", note: "Tarifa variable por peso/volumen" },
]

const apiUrl = import.meta.env.VITE_API_URL || ""
const ratesConfigUrl = `${apiUrl}/rates/rates/rates/config`

// Acordeón reutilizable
function AccordionSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 dark:text-white"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-white/[0.05] dark:text-white/80">
          {children}
        </div>
      )}
    </div>
  )
}

export default function RateTable() {
  // 🧮 Configuración editable de tarifas (valores como string para inputs)
  const [configRates, setConfigRates] = useState({
    motoKm: "0.10",
    minutePerson: "0.10",
    minuteWait: "0.10",
  })

  const [loadingConfig, setLoadingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const handleConfigChange =
    (field: keyof typeof configRates) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfigRates((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
      setSavedMessage(null)
      setError(null)
    }

  // 🔁 Cargar configuración desde el backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true)
        setError(null)

        const { data } = await axios.get(ratesConfigUrl)

        setConfigRates({
          motoKm: Number(data.moto_km ?? 0.1).toFixed(2),
          minutePerson: Number(data.minute_person ?? 0.1).toFixed(2),
          minuteWait: Number(data.minute_wait ?? 0.1).toFixed(2),
        })
      } catch (err) {
        console.error("Error cargando configuración de tarifas:", err)
        setError("No se pudo cargar la configuración de tarifas")
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchConfig()
  }, [])

  // 💾 Guardar configuración en backend
  const handleSaveConfig = async () => {
    setError(null)
    setSavedMessage(null)

    const motoKmNum = Number(configRates.motoKm)
    const minutePersonNum = Number(configRates.minutePerson)
    const minuteWaitNum = Number(configRates.minuteWait)

    const errors: string[] = []
    if (isNaN(motoKmNum) || motoKmNum < 0) {
      errors.push("Costo por KM - Motos debe ser un número mayor o igual a 0")
    }
    if (isNaN(minutePersonNum) || minutePersonNum < 0) {
      errors.push("Costo por Minuto - Personas debe ser un número mayor o igual a 0")
    }
    if (isNaN(minuteWaitNum) || minuteWaitNum < 0) {
      errors.push("Costo por Minuto - Espera debe ser un número mayor o igual a 0")
    }

    if (errors.length > 0) {
      setError(errors.join(" | "))
      return
    }

    try {
      setSavingConfig(true)

      await axios.put(ratesConfigUrl, {
        moto_km: motoKmNum,
        minute_person: minutePersonNum,
        minute_wait: minuteWaitNum,
      })

      setSavedMessage("Configuración guardada correctamente ✅")
    } catch (err) {
      console.error("Error guardando configuración de tarifas:", err)
      setError("Ocurrió un error al guardar la configuración")
    } finally {
      setSavingConfig(false)
    }
  }

  return (
    <>
      <PageMeta
        title="Tabla de Tarifas - GetPack"
        description="Vista de las tarifas de envío y paquetes"
      />

      <div className="p-4 md:p-6 flex flex-col gap-6">
        {/* HEADER */}
        <header>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
            Tabla de Tarifas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            Consulta las tarifas de envíos, paquetes y configuraciones
            adicionales.
          </p>
        </header>

        {/* Mensajes globales de estado */}
        {loadingConfig && (
          <p className="text-xs text-gray-500 dark:text-white/60">
            Cargando configuración de tarifas...
          </p>
        )}
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
        {savedMessage && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {savedMessage}
          </p>
        )}

        {/* ACCORDIONS */}
        <section className="space-y-4">
          {/* Tarifa de Envío */}
          <AccordionSection title="Tarifas de Envío">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-white/60">
                    <th className="py-2 pr-4">Tipo de envío</th>
                    <th className="py-2 pr-4">Tarifa</th>
                    <th className="py-2 pr-4">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/[0.07]">
                  {shippingRates.map((rate, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">
                        {rate.label}
                      </td>
                      <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                        {rate.price}
                      </td>
                      <td className="py-2 pr-4 text-gray-500 dark:text-white/70">
                        {rate.note || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionSection>

          {/* Tarifa de Paquetes */}
          <AccordionSection title="Tarifas de Paquetes">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-white/60">
                    <th className="py-2 pr-4">Rango / Tipo de paquete</th>
                    <th className="py-2 pr-4">Tarifa</th>
                    <th className="py-2 pr-4">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/[0.07]">
                  {packageRates.map((rate, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">
                        {rate.label}
                      </td>
                      <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                        {rate.price}
                      </td>
                      <td className="py-2 pr-4 text-gray-500 dark:text-white/70">
                        {rate.note || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionSection>

          {/* 🆕 Configuración de Tarifas */}
          <AccordionSection title="Configuración de Tarifas">
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-white/60 mb-1">
                Ajusta los valores base usados para cálculos dinámicos de
                viajes y servicios.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-white/60">
                      <th className="py-2 pr-4">Concepto</th>
                      <th className="py-2 pr-4">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/[0.07]">
                    {/* Costo por KM - Motos */}
                    <tr>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">
                        Costo por KM - Motos
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2 max-w-xs">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={configRates.motoKm}
                            onChange={handleConfigChange("motoKm")}
                            className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-white/20 dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500 dark:text-white/60">
                            USD / km
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Costo por Minuto - Personas */}
                    <tr>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">
                        Costo por Minuto - Personas
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2 max-w-xs">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={configRates.minutePerson}
                            onChange={handleConfigChange("minutePerson")}
                            className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-white/20 dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500 dark:text-white/60">
                            USD / min
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Costo por Minuto - Espera */}
                    <tr>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">
                        Costo por Minuto - Espera
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2 max-w-xs">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={configRates.minuteWait}
                            onChange={handleConfigChange("minuteWait")}
                            className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-white/20 dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500 dark:text-white/60">
                            USD / min
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Botón Guardar */}
              <div className="pt-2">
                <Button
                  size="sm"
                  className="px-4 py-1.5"
                  onClick={handleSaveConfig}
                  disabled={savingConfig || loadingConfig}
                >
                  {savingConfig ? "Guardando..." : "Guardar configuración"}
                </Button>
              </div>
            </div>
          </AccordionSection>
        </section>
      </div>
    </>
  )
}
