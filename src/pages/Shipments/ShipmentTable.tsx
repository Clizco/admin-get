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
import { HiEye, HiTrash, HiMap } from "react-icons/hi";

/* =======================
   Tipos
======================= */
interface Shipment {
  id: number;
  shipment_code: string;
  shipment_date: string;
  shipment_status: "Pending" | "Active" | "Delivered" | string;

  shipment_origin: string;          // province id (string numérica)
  shipment_destination: string;     // province id (string numérica)

  // ✅ NUEVOS (traídos del board del driver)
  shipment_origin_address?: string | null;
  shipment_destination_address?: string | null;

  shipment_sender_name: string;
  shipment_sender_phonenumber: string;
  shipment_receiver_name: string;
  shipment_receiver_phonenumber: string;
  shipment_description: string;
  shipment_assigned_user: string | null;
  shipment_user: number;            // id del creador
}

interface Province {
  id: number;
  province_name: string;
}

interface UserRow {
  id: number;
  user_firstname?: string;
  user_lastname?: string;
  user_email: string;
}

/* =======================
   helpers & config
======================= */
const apiUrl = import.meta.env.VITE_API_URL || "";

const statusOptions = [
  { value: "Pending", label: "Pendiente" },
  { value: "Active", label: "Activo" },
  { value: "Delivered", label: "Entregado" },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ✅ fecha + hora en 24h
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// ✅ helpers traídos/adaptados del DriverShipmentsBoard
const telHref = (phone?: string) =>
  phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;

const mapsHref = (from: string, to: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`;

/* =======================
   Modal de Detalles
======================= */
interface ShipmentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  shipment: Shipment | null;

  // helpers
  getProvinceName: (id: string) => string;
  getUserDisplay: (userId: number) => string;

  // acciones
  onDeleteShipment: (shipmentId: number) => Promise<void>;
}

function ShipmentDetailsModal({
  open,
  onClose,
  shipment,
  getProvinceName,
  getUserDisplay,
  onDeleteShipment,
}: ShipmentDetailsModalProps) {
  if (!open || !shipment) return null;

  const colorByStatus =
    shipment.shipment_status === "Active"
      ? "success"
      : shipment.shipment_status === "Pending"
      ? "warning"
      : "error";

  // helpers para etiquetas y Maps
  const originName = getProvinceName(shipment.shipment_origin);
  const destName = getProvinceName(shipment.shipment_destination);

  const originLabel = shipment.shipment_origin_address?.trim()
    ? `${originName} · ${shipment.shipment_origin_address}`
    : originName;

  const destLabel = shipment.shipment_destination_address?.trim()
    ? `${destName} · ${shipment.shipment_destination_address}`
    : destName;

  const mapsFrom = shipment.shipment_origin_address?.trim() || originName;
  const mapsTo = shipment.shipment_destination_address?.trim() || destName;

  const onDelete = async () => {
    if (!confirm(`¿Eliminar envío ${shipment.shipment_code}?`)) return;
    await onDeleteShipment(shipment.id);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
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

            <Badge size="sm" color={colorByStatus as any}>
              {shipment.shipment_status}
            </Badge>
          </div>

          {/* X de cierre */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
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
                {shipment.shipment_sender_phonenumber ? (
                  <a
                    className="text-blue-600"
                    href={telHref(shipment.shipment_sender_phonenumber)}
                  >
                    {shipment.shipment_sender_phonenumber}
                  </a>
                ) : "—"}
              </p>
              <p>
                <span className="font-semibold">Pickup:</span>{" "}
                {originLabel}
              </p>
            </div>
          </section>

          {/* Destinatario */}
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
                {shipment.shipment_receiver_phonenumber ? (
                  <a
                    className="text-blue-600"
                    href={telHref(shipment.shipment_receiver_phonenumber)}
                  >
                    {shipment.shipment_receiver_phonenumber}
                  </a>
                ) : "—"}
              </p>
              <p>
                <span className="font-semibold">Delivery:</span>{" "}
                {destLabel}
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

          {/* Interno */}
          <section className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-xs uppercase font-medium text-gray-500 dark:text-white/50 mb-2">
              Interno
            </h3>
            <div className="space-y-1 text-gray-700 dark:text-white">
              <p>
                <span className="font-semibold">Creado por:</span>{" "}
                {getUserDisplay(shipment.shipment_user)}
              </p>
              <p>
                <span className="font-semibold">Creado el:</span>{" "}
                {formatDateTime(shipment.shipment_date)}
              </p>
            </div>
          </section>
        </div>

        {/* Footer (solo íconos) */}
        <div className="flex flex-wrap justify-end gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-white/[0.08]">
          {/* Maps (ícono) */}
          <a
            className="ml-auto"
            target="_blank"
            rel="noreferrer"
            href={mapsHref(mapsFrom, mapsTo)}
            aria-label="Abrir en Google Maps"
            title="Abrir en Google Maps"
          >
            <Button size="sm" variant="outline" className="p-2">
              <HiMap className="w-4 h-4" />
            </Button>
          </a>

          {/* Eliminar (ícono) */}
          <Button
            size="sm"
            variant="outline"
            className="p-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={onDelete}
            aria-label="Eliminar envío"
            
          >
            <HiTrash className="w-4 h-4" />
          </Button>

          {/* ❌ botón 'Cerrar' eliminado */}
        </div>
      </div>
    </div>
  );
}

/* =======================
   MAIN COMPONENT
======================= */
export default function ShipmentTable() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [provinces, setProvinces] = useState<Record<number, string>>({});
  const [allProvinces, setAllProvinces] = useState<Province[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [fade, setFade] = useState(false);

  // filtros
  const [statusFilter, setStatusFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  // modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // fetch provincias
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data } = await axios.get<Province[]>(`${apiUrl}/provinces/provinces/all`);
        const map: Record<number, string> = {};
        data.forEach((p) => (map[p.id] = p.province_name));
        setProvinces(map);
        setAllProvinces(data);
      } catch (error) {
        console.error("Error fetching province data:", error);
      }
    };
    fetchProvinces();
  }, []);

  // fetch usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get<UserRow[]>(`${apiUrl}/users/users/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const map: Record<number, string> = {};
        (data || []).forEach((u) => {
          const name = `${u.user_firstname ?? ""} ${u.user_lastname ?? ""}`.trim();
          map[u.id] = name || u.user_email;
        });
        setUsersMap(map);
      } catch (e) {
        console.error("Error fetching users:", e);
      }
    };
    fetchUsers();
  }, []);

  // fetch envíos
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;
        const { data } = await axios.get<Shipment[]>(`${apiUrl}/shipments/shipments/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShipments(data);
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

  // helpers provincias
  const getProvinceName = (provinceId: string) =>
    provinces[Number(provinceId)] || "Desconocido";

  // ✅ labels de origen/destino mostrando DIRECCIÓN si existe
  const originLabel = (s: Shipment) =>
    s.shipment_origin_address?.trim()
      ? `${getProvinceName(s.shipment_origin)} · ${s.shipment_origin_address}`
      : getProvinceName(s.shipment_origin);

  const destLabel = (s: Shipment) =>
    s.shipment_destination_address?.trim()
      ? `${getProvinceName(s.shipment_destination)} · ${s.shipment_destination_address}`
      : getProvinceName(s.shipment_destination);

  // ✅ values para Maps (si hay address, usarlo; si no, provincia)
  const mapsFromValue = (s: Shipment) =>
    s.shipment_origin_address?.trim() || getProvinceName(s.shipment_origin);

  const mapsToValue = (s: Shipment) =>
    s.shipment_destination_address?.trim() || getProvinceName(s.shipment_destination);

  // abrir/cerrar modal
  const openDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDetailsOpen(true);
  };
  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedShipment(null);
  };

  const deleteShipment = async (shipmentId: number) => {
    const s = shipments.find((x) => x.id === shipmentId);
    const label = s?.shipment_code ? ` (${s.shipment_code})` : "";

    if (!confirm(`¿Estás seguro de eliminar este envío${label}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${apiUrl}/shipments/shipments/delete/${shipmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setShipments((prev) => prev.filter((x) => x.id !== shipmentId));
      if (selectedShipment?.id === shipmentId) closeDetails();
    } catch (e: any) {
      console.error("Error eliminando envío:", e);
      alert(e?.response?.data?.message || "No se pudo eliminar el envío");
    }
  };

  // filtros frontend
  const filteredShipments = shipments.filter((s) => {
    const matchStatus = statusFilter ? s.shipment_status === statusFilter : true;
    const matchProvince = provinceFilter ? String(s.shipment_destination) === provinceFilter : true;
    return matchStatus && matchProvince;
  });

  // color del badge
  const badgeColor = (status: string): "success" | "warning" | "error" | undefined => {
    if (status === "Active") return "success";
    if (status === "Pending") return "warning";
    if (status === "Delivered") return "success";
    return undefined;
  };

  const getUserDisplay = (userId: number): string => {
    return usersMap[userId] || `Usuario ${userId}`;
  };

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
              ...allProvinces.map((p) => ({ value: String(p.id), label: p.province_name })),
            ]}
          />
        </div>

        {/* Desktop */}
        <div className={`hidden md:block max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}>
          {loading ? (
            <div className="text-center text-gray-500 dark:text-white/70 p-8">Cargando envíos...</div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-white/70 p-8">No hay envíos registrados.</div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Código</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Fecha</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Pickup</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Delivery</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Remitente</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Descripción</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredShipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">{s.shipment_code}</TableCell>
                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">{formatDate(s.shipment_date)}</TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge size="sm" color={badgeColor(s.shipment_status)}>
                        {s.shipment_status}
                      </Badge>
                    </TableCell>

                    {/* ✅ ahora muestra dirección si existe */}
                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                      {originLabel(s)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                      {destLabel(s)}
                    </TableCell>

                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">{s.shipment_sender_name}</TableCell>
                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white max-w-[240px] truncate">{s.shipment_description}</TableCell>

                    <TableCell className="px-5 py-3 text-start">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Ver Detalles */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(s)}
                          aria-label="Ver detalles"
                          className="p-2"
                        >
                          <HiEye className="w-4 h-4" />
                          <span className="sr-only">Ver detalles</span>
                        </Button>

                        {/* ✅ acceso directo a Maps por fila */}
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={mapsHref(mapsFromValue(s), mapsToValue(s))}
                        >
                          <Button size="sm" variant="outline" className="p-2" aria-label="Ver en Maps">
                            <HiMap className="w-4 h-4" />
                            <span className="sr-only">Maps</span>
                          </Button>
                        </a>

                        {/* Eliminar */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteShipment(s.id)}
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
          )}
        </div>

        {/* Mobile */}
        <div className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}>
          {loading ? (
            <div className="text-center text-gray-500 dark:text-white/70">Cargando envíos...</div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-white/70">No hay envíos registrados.</div>
          ) : (
            filteredShipments.map((s) => (
              <div key={s.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="text-gray-700 dark:text-white">
                    <p className="font-medium text-blue-600 dark:text-blue-400">{s.shipment_code}</p>
                    <p className="text-xs text-gray-500 dark:text-white/50">{formatDate(s.shipment_date)}</p>
                  </div>
                  <Badge size="sm" color={badgeColor(s.shipment_status)}>{s.shipment_status}</Badge>
                </div>

                {/* ✅ dirección si existe */}
                <p className="text-gray-700 dark:text-white text-sm mt-1">
                  <strong>Pickup:</strong> {originLabel(s)}
                </p>
                <p className="text-gray-700 dark:text-white text-sm">
                  <strong>Delivery:</strong> {destLabel(s)}
                </p>

                <p className="text-gray-700 dark:text-white text-sm">
                  <strong>Remitente:</strong> {s.shipment_sender_name}
                </p>
                <p className="text-gray-700 dark:text-white text-sm leading-snug break-words">
                  <strong>Descripción:</strong> {s.shipment_description}
                </p>

                <div className="mt-3 flex gap-2">
                  {/* Ver Detalles */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDetails(s)}
                    aria-label="Ver detalles"
                    className="p-2 flex-1"
                  >
                    <HiEye className="w-4 h-4" />
                    <span className="sr-only">Ver detalles</span>
                  </Button>

                  {/* ✅ Maps directo */}
                  <a
                    className="flex-1"
                    target="_blank"
                    rel="noreferrer"
                    href={mapsHref(mapsFromValue(s), mapsToValue(s))}
                  >
                    <Button size="sm" variant="outline" className="p-2 w-full">
                      <HiMap className="w-4 h-4" />
                      <span className="sr-only">Maps</span>
                    </Button>
                  </a>

                  {/* Eliminar */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteShipment(s.id)}
                    aria-label="Eliminar"
                    className="p-2"
                  >
                    <HiTrash className="w-4 h-4" />
                    <span className="sr-only">Eliminar</span>
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
        getUserDisplay={getUserDisplay}
        onClose={closeDetails}
        shipment={selectedShipment}
        getProvinceName={(id) => provinces[Number(id)] || "Desconocido"}
        onDeleteShipment={deleteShipment}
      />
    </>
  );
}
