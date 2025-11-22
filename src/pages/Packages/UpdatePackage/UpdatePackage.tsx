import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ComponentCard from '../../../components/common/ComponentCard';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/button/Button';
import { ArrowLeft } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL || '';

export default function UpdatePackageStatus() {
  const { id: packageId } = useParams();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<{ id: number; status_name: string }[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | ''>('');
  const [trackingUspa, setTrackingUspa] = useState<string>('');

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${apiUrl}/packages/packages/${packageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSelectedStatusId(res.data.status_id);
        // Si el backend ya tuviera este campo, podrías inicializarlo:
        // setTrackingUspa(res.data.tracking_uspa || '');
      } catch (err) {
        console.error('Error al cargar el paquete:', err);
        alert('No se pudo cargar el paquete');
      }
    };

    const fetchStatuses = async () => {
      try {
        const response = await axios.get(`${apiUrl}/packages/statuses`);
        setStatuses(response.data);
      } catch (err) {
        console.error('Error obteniendo estados:', err);
      }
    };

    fetchPackage();
    fetchStatuses();
  }, [packageId]);

  const selectedStatus = statuses.find((s) => s.id === selectedStatusId);
  const isRecibidoMiami =
    (selectedStatus?.status_name || '').toUpperCase() === 'RECIBIDO EN MIAMI';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedStatusId) {
      alert('Debes seleccionar un estado.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const payload: any = {
        status_id: selectedStatusId,
      };

      // Enviar tracking_uspa solo si se seleccionó RECIBIDO EN MIAMI y hay algo escrito
      if (isRecibidoMiami && trackingUspa.trim()) {
        payload.tracking_uspa = trackingUspa.trim();
      }

      await axios.put(
        `${apiUrl}/packages/packages/${packageId}/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('¡Estado actualizado!');
      navigate('/packages');
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Ocurrió un error al actualizar el estado del paquete.');
    }
  };
 
  return (
    <ComponentCard
      title={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span>Actualizacion de estado</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Estado</Label>
          <select
            value={selectedStatusId}
            onChange={(e) =>
              setSelectedStatusId(e.target.value ? Number(e.target.value) : '')
            }
            className="border rounded px-4 py-2 w-full dark:bg-gray-700 dark:text-white"
          >
            <option value="">Selecciona un estado</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.status_name}
              </option>
            ))}
          </select>
        </div>

        {isRecibidoMiami && (
          <div>
            <Label>Tracking USPA (opcional)</Label>
            <input
              type="text"
              maxLength={50}
              value={trackingUspa}
              onChange={(e) => setTrackingUspa(e.target.value)}
              className="border rounded px-4 py-2 w-full dark:bg-gray-700 dark:text-white"
              placeholder="Ej: USPA123456ABC"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Puedes ingresar letras y números, hasta 50 caracteres.
            </p>
          </div>
        )}

        <Button variant="primary" size="md" className="w-full">
          Actualizar
        </Button>
      </form>
    </ComponentCard>
  );
}
