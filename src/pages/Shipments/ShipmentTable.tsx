import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

// =======================
// Tipos
// =======================
interface Shipment {
  id: number;
  shipment_code: string;
  shipment_date: string;
  shipment_status: string;
  shipment_origin: string; // province id
  shipment_destination: string; // province id
  shipment_sender_name: string;
  shipment_sender_phonenumber: string;
  shipment_receiver_name: string;
  shipment_receiver_phonenumber: string;
  shipment_description: string;
  shipment_assigned_user: string | null;
  shipment_user: number;
}

interface Province {
  id: number;
  province_name: string;
}

// =======================
// Modal de Detalles
// =======================
interface ShipmentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  getProvinceName: (id: string) => string;
  formatDate: (d: string) => string;
}

function ShipmentDetailsModal({
  open,
  onClose,
  shipment,
  getProvinceName,
  formatDate,
}: ShipmentDetailsModalProps) {
  if (!open || !shipment) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card del modal */}
      <div className="relative w-[90%] max-w-lg rounded-xl bg-white dark:bg-gray-900 dark:text-white shadow-xl border border-gray-200 dark:border-white/[0.08] p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex flex-col">
              <span>Envío {shipment.shipment_code}</span>
              <span className="text-xs font-normal text-gray-500 dark:text-white/50">
                {formatDate(shipment.shipment_date)}
              </span>
            </h2>

            <Badge
              size="sm"
              color={
                shipment.shipment_status === "Active"
                  ? "success"
                  : shipment.shipment_status === "Pending"
                  ? "warning"
                  : "error"
              }
            >
              {shipment.shipment_status}
            </Badge>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition"
            aria-label="Cerrar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
          {/* Ruta */}
          <section className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-xs uppercase font-medium text-gray-500 dark:text-white/50 mb-2">
              Ruta
            </h3>
            <div className="space-y-1 text-gray-700 dark:text-white">
              <p>
                <span className="font-semibold">Origen:</span>{" "}
                {getProvinceName(shipment.shipment_origin)}
              </p>
              <p>
                <span className="font-semibold">Destino:</span>{" "}
                {getProvinceName(shipment.shipment_destination)}
              </p>
            </div>
          </section>

          {/* Remitente */}
          <section className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-xs uppercase font-medium text-gray-500 dark:text-white/50 mb-2">
              Remitente
            </h3>
            <div className="space-y-1 text-gray-700 dark:text-white">
              <p>
                <span className="font-semibold">Nombre:</span>{" "}
                {shipment.shipment_sender_name || "—"}
              </p>
              <p>
                <span className="font-semibold">Teléfono:</span>{" "}
                {shipment.shipment_sender_phonenumber || "—"}
              </p>
            </div>
          </section>

          {/* Receptor */}
          <section className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-xs uppercase font-medium text-gray-500 dark:text-white/50 mb-2">
              Destinatario
            </h3>
            <div className="space-y-1 text-gray-700 dark:text-white">
              <p>
                <span className="font-semibold">Nombre:</span>{" "}
                {shipment.shipment_receiver_name || "—"}
              </p>
              <p>
                <span className="font-semibold">Teléfono:</span>{" "}
                {shipment.shipment_receiver_phonenumber || "—"}
              </p>
            </div>
          </section>

          {/* Descripción */}
          <section className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-xs uppercase font-medium text-gray-500 dark:text-white/50 mb-2">
              Descripción del Envío
            </h3>
            <p className="text-gray-700 dark:text-white/90 leading-relaxed break-words">
              {shipment.shipment_description || "Sin descripción"}
            </p>
          </section>

          {/* Info interna */}
          <section className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-xs uppercase font-medium text-gray-500 dark:text-white/50 mb-2">
              Interno
            </h3>
            <div className="space-y-1 text-gray-700 dark:text-white">
              <p>
                <span className="font-semibold">Asignado a:</span>{" "}
                {shipment.shipment_assigned_user || "—"}
              </p>
              <p>
                <span className="font-semibold">ID Usuario:</span>{" "}
                {shipment.shipment_user}
              </p>
              <p>
                <span className="font-semibold">ID Interno Envío:</span>{" "}
                {shipment.id}
              </p>
            </div>
          </section>
        </div>

        {/* Footer modal */}
        <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 dark:border-white/[0.08]">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

// =======================
// funciones helpers
// =======================
const apiUrl = import.meta.env.VITE_API_URL || "";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// =======================
// MAIN COMPONENT
// =======================
export default function ShipmentTable() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [provinces, setProvinces] = useState<Record<number, string>>({});
  const [allProvinces, setAllProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [fade, setFade] = useState(false);

  // filtros
  const [statusFilter, setStatusFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  // modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // fetch provincias
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data } = await axios.get<Province[]>(
          `${apiUrl}/provinces/provinces/all`
        );
        const provinceMap: Record<number, string> = {};
        data.forEach((province) => {
          provinceMap[province.id] = province.province_name;
        });
        setProvinces(provinceMap);
        setAllProvinces(data);
      } catch (error) {
        console.error("Error fetching province data:", error);
      }
    };
    fetchProvinces();
  }, []);

  // fetch envíos
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        // esta ruta ahora devuelve TODOS los envíos (para administración)
        const response = await axios.get<Shipment[]>(
          `${apiUrl}/shipments/shipments/all`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setShipments(response.data);
      } catch (error) {
        console.error("Error fetching shipment data:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setFade(true), 50);
      }
    };

    setFade(false);
    fetchShipments();
  }, []);

  // helpers
  const getProvinceName = (provinceId: string) => {
    const idNumber = Number(provinceId);
    return provinces[idNumber] || "Desconocido";
  };

  const openDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedShipment(null);
  };

  // filtros frontend
  const filteredShipments = shipments.filter((s) => {
    const matchStatus = statusFilter
      ? s.shipment_status === statusFilter
      : true;
    const matchProvince = provinceFilter
      ? String(s.shipment_destination) === provinceFilter
      : true;
    return matchStatus && matchProvince;
  });

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] relative">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
          <Select
            label="Filtrar por estado"
            value={statusFilter}
            onChange={(value: string) => setStatusFilter(value)}
            options={[
              { value: "", label: "Todos" },
              { value: "Pending", label: "Pendiente" },
              { value: "Active", label: "Activo" },
              { value: "Delivered", label: "Entregado" },
            ]}
          />

          <Select
            label="Filtrar por destino"
            value={provinceFilter}
            onChange={(value: string) => setProvinceFilter(value)}
            options={[
              { value: "", label: "Todos" },
              ...allProvinces.map((province) => ({
                value: String(province.id),
                label: province.province_name,
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
          {loading ? (
            <div className="text-center text-gray-500 dark:text-white/70 p-8">
              Cargando envíos...
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-white/70 p-8">
              No hay envíos registrados.
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400"
                  >
                    Código
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400"
                  >
                    Fecha
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400"
                  >
                    Estado
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400"
                  >
                    Origen
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400"
                  >
                    Destino
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400"
                  >
                    Remitente
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400"
                  >
                    Descripción
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400"
                  >
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredShipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-gray-700 dark:text-white">
                      {s.shipment_code}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-white">
                      {formatDate(s.shipment_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        size="sm"
                        color={
                          s.shipment_status === "Active"
                            ? "success"
                            : s.shipment_status === "Pending"
                            ? "warning"
                            : "error"
                        }
                      >
                        {s.shipment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-white">
                      {getProvinceName(s.shipment_origin)}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-white">
                      {getProvinceName(s.shipment_destination)}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-white">
                      {s.shipment_sender_name}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-white max-w-[200px] truncate">
                      {s.shipment_description}
                    </TableCell>

                    <TableCell className="text-gray-700 dark:text-white">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetails(s)}
                      >
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Mobile cards */}
        <div
          className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {loading ? (
            <div className="text-center text-gray-500 dark:text-white/70">
              Cargando envíos...
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-white/70">
              No hay envíos registrados.
            </div>
          ) : (
            filteredShipments.map((s) => (
              <div
                key={s.id}
                className="border rounded-lg p-4 text-sm bg-white dark:bg-white/5 border-gray-200 dark:border-white/[0.05] space-y-2 shadow-sm"
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
                  <Badge
                    size="sm"
                    color={
                      s.shipment_status === "Active"
                        ? "success"
                        : s.shipment_status === "Pending"
                        ? "warning"
                        : "error"
                    }
                  >
                    {s.shipment_status}
                  </Badge>
                </div>

                <p className="text-gray-700 dark:text-white text-sm">
                  <strong>Origen:</strong>{" "}
                  {getProvinceName(s.shipment_origin)}
                </p>
                <p className="text-gray-700 dark:text-white text-sm">
                  <strong>Destino:</strong>{" "}
                  {getProvinceName(s.shipment_destination)}
                </p>

                <p className="text-gray-700 dark:text-white text-sm">
                  <strong>Remitente:</strong> {s.shipment_sender_name}
                </p>

                <p className="text-gray-700 dark:text-white text-sm leading-snug break-words">
                  <strong>Descripción:</strong> {s.shipment_description}
                </p>

                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDetails(s)}
                    className="w-full"
                  >
                    Ver Detalles
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Detalles */}
      <ShipmentDetailsModal
        open={isDetailsOpen}
        onClose={closeDetails}
        shipment={selectedShipment}
        getProvinceName={getProvinceName}
        formatDate={formatDate}
      />
    </>
  );
}
