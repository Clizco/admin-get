import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import Button from '../../components/ui/button/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

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
  user_prefix: string;      // <-- Código de Get
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

  // 🔐 estados para cambio de contraseña
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Si hay id, estamos editando => bloquear user_prefix
  const isEditing = Boolean(id);
  const isPrefixLocked = isEditing; // "no se puede editar una vez creado"

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
    // Evitar cambios en el código de Get una vez creado
    if (field === 'user_prefix' && isPrefixLocked) return;

    if (user) setUser({ ...user, [field]: value });
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      // 🧠 Validación de contraseña SOLO si el admin escribe algo
      if (password || confirmPassword) {
        if (password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          return;
        }
        if (password !== confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          return;
        }
      }

      // Evitar enviar user_prefix si está bloqueado (defensa extra)
      const payload: any = { ...user };

      if (isPrefixLocked) {
        delete payload.user_prefix;
      }

      // Si el admin escribió una nueva contraseña, la mandamos
      if (password.trim() !== '') {
        payload.user_password = password; // el backend la debe hashear
      }

      await axios.put(`${apiUrl}/users/users/update/${id}`, payload);
      toast.success('Usuario actualizado correctamente');
      navigate('/users');
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('No se pudo actualizar el usuario');
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    try {
      await axios.delete(`${apiUrl}/users/users/delete/${id}`);
      toast.success('Usuario eliminado correctamente');
      navigate('/users');
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('No se pudo eliminar el usuario');
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

        {/* 🔐 CÓDIGO DE GET (user_prefix) BLOQUEADO SI ES EDICIÓN */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Código de Get (prefijo)
            </label>
            {isPrefixLocked && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-white/60">
                <Lock className="w-3.5 h-3.5" /> bloqueado
              </span>
            )}
          </div>

          <Input
            value={user.user_prefix}
            onChange={(e) => handleChange('user_prefix', e.target.value)}
            disabled={isPrefixLocked}              // <-- deshabilitado al editar
            placeholder="Ej: GET-123"
            className={isPrefixLocked ? 'opacity-70 cursor-not-allowed' : ''}
          />

          {isPrefixLocked && (
            <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
              Este código no puede modificarse una vez creado.
            </p>
          )}
        </div>

        {/* 🔑 Cambio de contraseña opcional para admin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nueva contraseña (opcional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Dejar en blanco para no cambiar"
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contraseña"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
          Si dejas los campos de contraseña vacíos, la contraseña actual se mantendrá.
        </p>

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
          <Button variant="outline" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
