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
import Button from '../../components/ui/button/Button';
import { useNavigate } from 'react-router-dom';

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
  const [loading, setLoading] = useState(false);
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data } = await axios.get<Province[]>(`${apiUrl}/provinces/provinces/all`);
        const provinceMap: Record<number, string> = {};
        data.forEach((province) => {
          provinceMap[province.id] = province.province_name;
        });
        setProvinces(provinceMap);
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
        const user = JSON.parse(localStorage.getItem('decodedToken') || '{}');
        const userId = user?.id;

        if (!token || !userId) {
          console.error('Token o datos de usuario no encontrados.');
          return;
        }

        const url = `${apiUrl}/shipments/shipments/user/${userId}`;
        const response = await axios.get<Shipment[]>(url, {
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

  const handleCreate = () => {
    navigate('/create-shipment');
  };

  const getProvinceName = (provinceId: string) => {
    const idNumber = Number(provinceId);
    return provinces[idNumber] || 'Desconocido';
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Botón para crear envío */}
      <div className="flex justify-end p-4">
        <Button size="sm" variant="primary" onClick={handleCreate}>
          Crear Envío
        </Button>
      </div>

      {/* Tabla de envíos enviados */}
      <div
        className={`max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {loading ? (
          <div className="text-center text-gray-500 dark:text-white/70 p-8">Cargando envíos...</div>
        ) : shipments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70 p-8">
            No tienes envíos enviados aún.
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Código</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Fecha</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Origen</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Destino</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Remitente</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Descripción</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="px-5 py-3 text-start text-gray-500 text-theme-sm dark:text-gray-400">{shipment.shipment_code}</TableCell>
                  <TableCell className="px-5 py-3 text-start text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(shipment.shipment_date)}</TableCell>
                  <TableCell className="px-5 py-3 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                    <Badge
                      size="sm"
                      color={
                        shipment.shipment_status === 'Active'
                          ? 'success'
                          : shipment.shipment_status === 'Pending'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {shipment.shipment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-start text-gray-500 text-theme-sm dark:text-gray-400">{getProvinceName(shipment.shipment_origin)}</TableCell>
                  <TableCell className="px-5 py-3 text-start text-gray-500 text-theme-sm dark:text-gray-400">{getProvinceName(shipment.shipment_destination)}</TableCell>
                  <TableCell className="px-5 py-3 text-start text-gray-500 text-theme-sm dark:text-white/90 font-medium">{shipment.shipment_sender_name}</TableCell>
                  <TableCell className="px-5 py-3 text-start text-gray-500 text-theme-sm dark:text-gray-400">{shipment.shipment_description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
