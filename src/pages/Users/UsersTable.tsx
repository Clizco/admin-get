import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { EyeIcon } from 'lucide-react';

interface User {
  id: number;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_phonenumber: string;
  user_prefix: string;
  user_province: number;
  role_id: number;
}

interface Province {
  id: number;
  province_name: string;
}

const apiUrl = import.meta.env.VITE_API_URL || '';

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceMap, setProvinceMap] = useState<Record<number, string>>({});
  const [provinceFilter, setProvinceFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, provincesRes] = await Promise.all([
          axios.get<User[]>(`${apiUrl}/users/users/all`),
          axios.get<Province[]>(`${apiUrl}/provinces/provinces/all`)
        ]);
        setUsers(usersRes.data);
        setProvinces(provincesRes.data);
        const map: Record<number, string> = {};
        provincesRes.data.forEach(p => (map[p.id] = p.province_name));
        setProvinceMap(map);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setTimeout(() => setFade(true), 50);
      }
    };

    setFade(false);
    fetchData();
  }, []);

  const getProvinceName = (id: number) => provinceMap[id] || 'Desconocido';

  const filteredUsers = users.filter(u => {
    const fullName = `${u.user_firstname} ${u.user_lastname}`.toLowerCase();
    return (
      (!provinceFilter || u.user_province === Number(provinceFilter)) &&
      (!roleFilter || u.role_id === Number(roleFilter)) &&
      (!nameFilter || fullName.includes(nameFilter.toLowerCase()))
    );
  });

  const handleViewUser = (id: number) => navigate(`/users/${id}`);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 p-4 border-b border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.02]">
        <div>
          <label htmlFor="nameFilter" className="block text-sm font-medium text-gray-700 dark:text-white">
            Buscar por nombre
          </label>
          <Input
            id="nameFilter"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Nombre del usuario"
          />
        </div>
        <Select
          label="Filtrar por provincia"
          value={provinceFilter}
          onChange={(val) => setProvinceFilter(val)}
          options={[{ value: '', label: 'Todas' }, ...provinces.map(p => ({ value: String(p.id), label: p.province_name }))]}
        />
        <Select
          label="Filtrar por rol"
          value={roleFilter}
          onChange={(val) => setRoleFilter(val)}
          options={[
            { value: '', label: 'Todos' },
            { value: '1', label: 'Administrador' },
            { value: '2', label: 'Usuario' },
            { value: '3', label: 'Conductor' },
          ]}
        />
      </div>

      {/* Escritorio */}
      <div className={`hidden md:block max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70 p-8">No hay usuarios registrados.</div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Nombre</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Email</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Teléfono</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Provincia</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Prefijo</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Rol</TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">Acción</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-gray-700 dark:text-white">{user.user_firstname} {user.user_lastname}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{user.user_email}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{user.user_phonenumber}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{getProvinceName(user.user_province)}</TableCell>
                  <TableCell className="text-gray-700 dark:text-white">{user.user_prefix}</TableCell>
                  <TableCell>
                    <Badge size="sm" color={
                      user.role_id === 1 ? 'success' :
                      user.role_id === 2 ? 'warning' : 'error'
                    }>
                      {user.role_id === 1 ? 'Admin' : user.role_id === 2 ? 'Usuario' : 'Conductor'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="primary" onClick={() => handleViewUser(user.id)}>
                      <EyeIcon className="w-4 h-4 mr-1" /> Ver
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
        {filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70">No hay usuarios registrados.</div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="border rounded-lg p-4 text-sm bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.05] space-y-1">
              <p className="text-gray-700 dark:text-white"><strong>Nombre:</strong> {user.user_firstname} {user.user_lastname}</p>
              <p className="text-gray-700 dark:text-white"><strong>Email:</strong> {user.user_email}</p>
              <p className="text-gray-700 dark:text-white"><strong>Teléfono:</strong> {user.user_phonenumber}</p>
              <p className="text-gray-700 dark:text-white"><strong>Provincia:</strong> {getProvinceName(user.user_province)}</p>
              <p className="text-gray-700 dark:text-white"><strong>Prefijo:</strong> {user.user_prefix}</p>
              <p className="text-gray-700 dark:text-white"><strong>Rol:</strong>{' '}
                <Badge size="sm" color={
                  user.role_id === 1 ? 'success' : user.role_id === 2 ? 'warning' : 'error'
                }>
                  {user.role_id === 1 ? 'Admin' : user.role_id === 2 ? 'Usuario' : 'Conductor'}
                </Badge>
              </p>
              <Button size="sm" variant="primary" onClick={() => handleViewUser(user.id)}>
                <EyeIcon className="w-4 h-4 mr-1" /> Ver
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
