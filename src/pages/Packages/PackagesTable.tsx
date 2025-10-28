import { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { useNavigate } from 'react-router-dom';
import { HiPlus, HiTrash } from 'react-icons/hi';
import Select from '../../components/form/Select';

interface Product {
  id: number;
  product_weight: string;
  product_unit: string;
  product_description: string;
  product_value: string;
  product_store: string;
}

interface Package {
  id: number;
  package_tracking_id: string;
  status_name: string;
  created_at: string;
  products: Product[];
  user_id: number;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_prefix: string;
  user_fullname: string;
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

const getStatusColor = (
  status: string
): 'success' | 'warning' | 'error' | undefined => {
  switch (status.toUpperCase()) {
    case 'ENTREGADO':
      return 'success';
    case 'EN TRANSITO A MIAMI':
    case 'EN TRANSITO A PANAMA':
      return 'warning';
    case 'POR CONFIRMAR':
      return 'error';
    default:
      return undefined;
  }
};

export default function PackageTableAdmin() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [filter, setFilter] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [search, setSearch] = useState<string>('');
  const navigate = useNavigate();

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Package[]>(`${apiUrl}/packages/packages/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching package data:', error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await axios.get(`${apiUrl}/packages/statuses`);
      setStatuses(['Todos', ...response.data.map((s: any) => s.status_name)]);
    } catch (err) {
      console.error('Error obteniendo estados:', err);
    }
  };

  const handleEdit = (packageId: number) => {
    navigate(`/packages/edit/${packageId}`);
  };

  const handleDelete = async (packageId: number) => {
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar este paquete?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiUrl}/packages/packages/delete/${packageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Actualiza lista tras eliminar
      setPackages((prev) => prev.filter((pkg) => pkg.id !== packageId));
    } catch (error) {
      console.error('Error eliminando paquete:', error);
      alert('Ocurrió un error al eliminar el paquete.');
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchStatuses();
  }, []);

  const filteredPackages = packages.filter((pkg) => {
    const matchesStatus = selectedStatus === 'Todos' || pkg.status_name === selectedStatus;
    const matchesSearch = pkg.package_tracking_id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      pkg.user_fullname.toLowerCase().includes(filter.toLowerCase()) ||
      pkg.user_email.toLowerCase().includes(filter.toLowerCase()) ||
      pkg.user_prefix.toLowerCase().includes(filter.toLowerCase());

    return matchesStatus && matchesSearch && matchesFilter;
  });

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filtros */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por cliente o email
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={filter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Buscar por Tracking ID
          </label>
          <input
            type="text"
            placeholder="Ej: 123ABC456"
            className="w-full p-2 border rounded-md dark:bg-white/[0.02] dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por estado
          </label>
          <Select
            className="w-full p-2 border rounded-md dark:bg-white/[0.02] dark:text-white"
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            options={statuses.map((status) => ({ value: status, label: status }))}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Creado</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Tracking</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Estado</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Cliente</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Acciones</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filteredPackages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">{formatDate(pkg.created_at)}</TableCell>
                <TableCell className="px-5 py-3 text-blue-600 dark:text-blue-400 font-medium">{pkg.package_tracking_id}</TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                  <Badge size="sm" color={getStatusColor(pkg.status_name)}>{pkg.status_name}</Badge>
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">
                  <button
                    onClick={() => navigate(`/users/${pkg.user_id}`)}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {pkg.user_fullname}
                  </button>
                </TableCell>

                <TableCell className="px-5 py-3 text-start">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(pkg.id)}>
                      Actualizar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(pkg.id)}
                      className="flex items-center gap-1"
                    >
                      <HiTrash className="w-4 h-4" /> Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden p-4 space-y-4">
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Fecha:</strong> {formatDate(pkg.created_at)}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium"><strong>Tracking:</strong> {pkg.package_tracking_id}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Estado:</strong>{' '}
              <Badge size="sm" color={getStatusColor(pkg.status_name)}>{pkg.status_name}</Badge>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Cliente:</strong>{' '}
              <button onClick={() => navigate(`/users/${pkg.user_id}`)} className="text-blue-600 hover:underline dark:text-blue-400">
                {pkg.user_fullname}
              </button>
            </p>

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(pkg.id)}>Actualizar</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(pkg.id)}
                className="flex items-center gap-1"
              >
                <HiTrash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Botón flotante (FAB) */}
      <button
        onClick={() => navigate('/create-package')}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-110"
        title="Crear paquete"
      >
        <HiPlus className="w-6 h-6" />
      </button>
    </div>
  );
}
