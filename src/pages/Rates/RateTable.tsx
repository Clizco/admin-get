// src/views/rates/RateTable.tsx
import { useState, ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import PageMeta from "../../components/common/PageMeta"

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
            Consulta las tarifas de envíos y paquetes para tus servicios.
          </p>
        </header>

        {/* ACCORDIONS */}
        <section className="space-y-4">
          {/* Tarifa de Envío */}
          <AccordionSection title="Tarifas de Envio">
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
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{rate.label}</td>
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
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{rate.label}</td>
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
        </section>
      </div>
    </>
  )
}
