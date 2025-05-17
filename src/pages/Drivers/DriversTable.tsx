import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import Button from '../../components/ui/button/Button';

interface Driver {
  id: number;
  driver_name: string;
  driver_phonenumber: string;
  driver_email: string;
  driver_province: number;
  created_at: string;
}

interface Province {
  id: number;
  province_name: string;
}

const apiUrl = import.meta.env.VITE_API_URL || '';
const driversUrl = `${apiUrl}/drivers/drivers/all`;
const provincesUrl = `${apiUrl}/provinces/provinces/all`;

export default function DriverTable() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversRes, provincesRes] = await Promise.all([
          axios.get<Driver[]>(driversUrl),
          axios.get<Province[]>(provincesUrl),
        ]);
        setDrivers(driversRes.data);
        setProvinces(provincesRes.data);
        setTimeout(() => setFade(true), 50);
      } catch (error) {
        console.error('Error fetching drivers or provinces:', error);
      }
    };

    setFade(false);
    fetchData();
  }, []);

  const getProvinceName = (id: number) =>
    provinces.find((p) => p.id === id)?.province_name || 'Desconocido';

  const handleDelete = (driverId: number) => {
    console.log(`Eliminar conductor con ID: ${driverId}`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Escritorio */}
      <div className={`hidden md:block max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {drivers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70 p-8">No hay conductores registrados.</div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Nombre</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Teléfono</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Email</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Provincia</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Fecha de registro</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Acción</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="text-gray-700 dark:text-white">{driver.driver_name}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{driver.driver_phonenumber}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{driver.driver_email}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{getProvinceName(driver.driver_province)}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">
                    {new Date(driver.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="primary" onClick={() => handleDelete(driver.id)}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Móvil */}
      <div className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {drivers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70">No hay conductores registrados.</div>
        ) : (
          drivers.map((driver) => (
            <div key={driver.id} className="border rounded-lg p-4 text-sm bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.05] space-y-1">
              <p className="text-gray-700 dark:text-white"><strong>Nombre:</strong> {driver.driver_name}</p>
              <p className="text-gray-700 dark:text-white"><strong>Teléfono:</strong> {driver.driver_phonenumber}</p>
              <p className="text-gray-700 dark:text-white"><strong>Email:</strong> {driver.driver_email}</p>
              <p className="text-gray-700 dark:text-white"><strong>Provincia:</strong> {getProvinceName(driver.driver_province)}</p>
              <p className="text-gray-700 dark:text-white"><strong>Fecha:</strong> {new Date(driver.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}</p>
              <Button size="sm" variant="primary" onClick={() => handleDelete(driver.id)}>
                Eliminar
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
