import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ComponentCard from '../../../components/common/ComponentCard';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/button/Button';

const apiUrl = import.meta.env.VITE_API_URL || '';

export default function UpdatePackageStatus() {
  const { id: packageId } = useParams();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<{ id: number; status_name: string }[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | ''>('');

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${apiUrl}/packages/packages/${packageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSelectedStatusId(res.data.status_id);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${apiUrl}/packages/packages/${packageId}/status`, {
        status_id: selectedStatusId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('¡Estado actualizado!');
      navigate('/packages');
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Ocurrió un error al actualizar el estado del paquete.');
    }
  };

  return (
    <ComponentCard title="Actualizar Estado del Paquete">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Volver
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Label>Estado</Label>
        <select
          value={selectedStatusId}
          onChange={(e) => setSelectedStatusId(Number(e.target.value))}
          className="border rounded px-4 py-2 w-full dark:bg-gray-700 dark:text-white"
        >
          <option value="">Selecciona un estado</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.status_name}
            </option>
          ))}
        </select>

        <Button variant="primary" size="md" className="w-full">
          Actualizar Estado
        </Button>
      </form>
    </ComponentCard>
  );
}