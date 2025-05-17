import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import Badge from '../../components/ui/badge/Badge';
import Select from '../../components/form/Select';

interface Shipment {
  id: number;
  shipment_code: string;
  shipment_date: string;
  shipment_status: string;
  shipment_origin: string;
  shipment_destination: string;
  shipment_sender_name: string;
  shipment_description: string;
}

interface Province {
  id: number;
  province_name: string;
}

const apiUrl = import.meta.env.VITE_API_URL || '';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function ShipmentTable() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [provinces, setProvinces] = useState<Record<number, string>>({});
  const [allProvinces, setAllProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [fade, setFade] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data } = await axios.get<Province[]>(`${apiUrl}/provinces/provinces/all`);
        const provinceMap: Record<number, string> = {};
        data.forEach((province) => {
          provinceMap[province.id] = province.province_name;
        });
        setProvinces(provinceMap);
        setAllProvinces(data);
      } catch (error) {
        console.error('Error fetching province data:', error);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get<Shipment[]>(`${apiUrl}/shipments/shipments/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setShipments(response.data);
      } catch (error) {
        console.error('Error fetching shipment data:', error);
      } finally {
        setLoading(false);
        setTimeout(() => setFade(true), 50);
      }
    };

    setFade(false);
    fetchShipments();
  }, []);

  const getProvinceName = (provinceId: string) => {
    const idNumber = Number(provinceId);
    return provinces[idNumber] || 'Desconocido';
  };

  // Filtro en frontend
  const filteredShipments = shipments.filter((s) => {
    const matchStatus = statusFilter ? s.shipment_status === statusFilter : true;
    const matchProvince = provinceFilter ? String(s.shipment_destination) === provinceFilter : true;
    return matchStatus && matchProvince;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
        <Select
          label="Filtrar por estado"
          value={statusFilter}
          onChange={(value: string) => setStatusFilter(value)}
          options={[
            { value: '', label: 'Todos' },
            { value: 'Pending', label: 'Pendiente' },
            { value: 'Active', label: 'Activo' },
            { value: 'Delivered', label: 'Entregado' },
          ]}
        />
        <Select
          label="Filtrar por destino"
          value={provinceFilter}
          onChange={(value: string) => setProvinceFilter(value)}
          options={[
            { value: '', label: 'Todos' },
            ...allProvinces.map((province) => ({
              value: String(province.id),
              label: province.province_name,
            })),
          ]}
        />
      </div>

      {/* Escritorio */}
      <div className={`hidden md:block max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {loading ? (
          <div className="text-center text-gray-500 dark:text-white/70 p-8">Cargando envíos...</div>
        ) : filteredShipments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70 p-8">No hay envíos registrados.</div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Código</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Fecha</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Origen</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Destino</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Remitente</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Descripción</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredShipments.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-gray-700 dark:text-white">{s.shipment_code}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{formatDate(s.shipment_date)}</TableCell>
                  <TableCell>
                    <Badge size="sm" color={
                      s.shipment_status === 'Active'
                        ? 'success'
                        : s.shipment_status === 'Pending'
                        ? 'warning'
                        : 'error'
                    }>
                      {s.shipment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{getProvinceName(s.shipment_origin)}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{getProvinceName(s.shipment_destination)}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{s.shipment_sender_name}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{s.shipment_description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Móvil */}
      <div className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {loading ? (
          <div className="text-center text-gray-500 dark:text-white/70">Cargando envíos...</div>
        ) : filteredShipments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70">No hay envíos registrados.</div>
        ) : (
          filteredShipments.map((s) => (
            <div key={s.id} className="border rounded-lg p-4 text-sm bg-white dark:bg-white/5 border-gray-200 dark:border-white/[0.05] space-y-1">
              <p className="text-gray-700 dark:text-white"><strong>Código:</strong> {s.shipment_code}</p>
              <p className="text-gray-700 dark:text-white"><strong>Fecha:</strong> {formatDate(s.shipment_date)}</p>
              <p className="text-gray-700 dark:text-white"><strong>Estado:</strong>{' '}
                <Badge size="sm" color={
                  s.shipment_status === 'Active'
                    ? 'success'
                    : s.shipment_status === 'Pending'
                    ? 'warning'
                    : 'error'
                }>
                  {s.shipment_status}
                </Badge>
              </p>
              <p className="text-gray-700 dark:text-white"><strong>Origen:</strong> {getProvinceName(s.shipment_origin)}</p>
              <p className="text-gray-700 dark:text-white"><strong>Destino:</strong> {getProvinceName(s.shipment_destination)}</p>
              <p className="text-gray-700 dark:text-white"><strong>Remitente:</strong> {s.shipment_sender_name}</p>
              <p className="text-gray-700 dark:text-white"><strong>Descripción:</strong> {s.shipment_description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
