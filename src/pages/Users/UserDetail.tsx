import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import Button from '../../components/ui/button/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Province {
  id: number;
  province_name: string;
}

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

const apiUrl = import.meta.env.VITE_API_URL || '';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, provinceRes] = await Promise.all([
          axios.get(`${apiUrl}/users/users/${id}`),
          axios.get(`${apiUrl}/provinces/provinces/all`)
        ]);

        setUser(userRes.data);
        setProvinces(provinceRes.data);
      } catch (error) {
        console.error('Error cargando usuario:', error);
        toast.error('Error al cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field: keyof User, value: any) => {
    if (user) setUser({ ...user, [field]: value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`${apiUrl}/users/users/update/${id}`, user);
      toast.success('Usuario actualizado correctamente');
      navigate('/users');
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('No se pudo actualizar el usuario');
    }
  };

  if (loading || !user) {
    return <div className="p-6 text-gray-500 dark:text-white/70">Cargando datos del usuario...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-xl mx-auto p-6 mt-6 rounded-xl shadow-md bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] transition-colors"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Editar Usuario</h2>

      <div className="space-y-4">
        <Input
          label="Nombre"
          value={user.user_firstname}
          onChange={(e) => handleChange('user_firstname', e.target.value)}
        />
        <Input
          label="Apellido"
          value={user.user_lastname}
          onChange={(e) => handleChange('user_lastname', e.target.value)}
        />
        <Input
          label="Email"
          value={user.user_email}
          onChange={(e) => handleChange('user_email', e.target.value)}
        />
        <Input
          label="Teléfono"
          value={user.user_phonenumber}
          onChange={(e) => handleChange('user_phonenumber', e.target.value)}
        />
        <Input
          label="Prefijo"
          value={user.user_prefix}
          onChange={(e) => handleChange('user_prefix', e.target.value)}
        />

        <Select
          label="Provincia"
          value={String(user.user_province)}
          onChange={(value) => handleChange('user_province', Number(value))}
          options={provinces.map(p => ({
            value: String(p.id),
            label: p.province_name,
          }))}
        />

        <Select
          label="Rol"
          value={String(user.role_id)}
          onChange={(value) => handleChange('role_id', Number(value))}
          options={[
            { value: '1', label: 'Administrador' },
            { value: '2', label: 'Usuario' },
            { value: '3', label: 'Conductor' },
          ]}
        />

        <div className="pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/users')}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
