// src/views/drivers/UpdateDriver.tsx
import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import ComponentCard from '../../../components/common/ComponentCard'
import Label from '../../../components/form/Label'
import Button from '../../../components/ui/button/Button'

const apiUrl = import.meta.env.VITE_API_URL || ''

type Province = { id: number; province_name: string }

type Driver = {
  id: number
  driver_name: string
  driver_lastname: string
  driver_phonenumber: string
  driver_email: string
  driver_province: number
  role_id: number
  created_at?: string
  updated_at?: string
}

export default function UpdateDriver() {
  const { id: driverId } = useParams()
  const navigate = useNavigate()

  const [provinces, setProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<Driver>({
    id: 0,
    driver_name: '',
    driver_lastname: '',
    driver_phonenumber: '',
    driver_email: '',
    driver_province: 0,
    role_id: 0,
  })

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('token')

        // 1) Cargar conductor
        const driverRes = await axios.get(`${apiUrl}/drivers/drivers/${driverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const d: Driver = driverRes.data
        setForm({
          id: d.id,
          driver_name: d.driver_name ?? '',
          driver_lastname: d.driver_lastname ?? '',
          driver_phonenumber: d.driver_phonenumber ?? '',
          driver_email: d.driver_email ?? '',
          driver_province: Number(d.driver_province) ?? 0,
          role_id: Number(d.role_id) ?? 0,
        })

        // 2) Cargar provincias
        const provRes = await axios.get(`${apiUrl}/provinces/provinces/all`)
        setProvinces(provRes.data ?? [])
      } catch (err) {
        console.error('Error cargando datos:', err)
        alert('No se pudo cargar la información del conductor')
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [driverId, navigate])

  const handleChange =
    (field: keyof Driver) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        field === 'driver_province' || field === 'role_id' ? Number(e.target.value) : e.target.value
      setForm((prev) => ({ ...prev, [field]: value as any }))
    }

  const validate = () => {
    if (!form.driver_name.trim()) return 'El nombre es obligatorio'
    if (!form.driver_lastname.trim()) return 'El apellido es obligatorio'
    if (!form.driver_email.trim()) return 'El correo es obligatorio'
    // patrón simple de email
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.driver_email)
    if (!emailOk) return 'El correo no es válido'
    if (!form.driver_phonenumber.trim()) return 'El teléfono es obligatorio'
    if (!form.driver_province) return 'La provincia es obligatoria'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      alert(err)
      return
    }

    try {
      const token = localStorage.getItem('token')

      // Solo actualizamos datos del conductor (sin password)
      const payload = {
        driver_name: form.driver_name.trim(),
        driver_lastname: form.driver_lastname.trim(),
        driver_phonenumber: form.driver_phonenumber.trim(),
        driver_email: form.driver_email.trim(),
        driver_province: Number(form.driver_province),
        // Si NO quieres permitir cambiar rol desde aquí, comenta la siguiente línea:
        //role_id: Number(form.role_id),
      }

      await axios.put(`${apiUrl}/drivers/drivers/update/${driverId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      alert('¡Conductor actualizado!')
      navigate('/drivers') // Ajusta a tu ruta de listado de conductores
    } catch (error: any) {
      console.error('Error al actualizar conductor:', error)
      // Mensajes comunes por unique constraints
      const msg =
        error?.response?.data?.message ||
        (String(error).includes('duplicate') ? 'Email o teléfono ya están en uso' : null) ||
        'Ocurrió un error al actualizar el conductor'
      alert(msg)
    }
  }

  if (loading) {
    return (
      <ComponentCard title="Actualizar Conductor">
        <div className="py-6">Cargando…</div>
      </ComponentCard>
    )
  }

  return (
    <ComponentCard title="Actualizar Conductor">
      <div className="flex justify-start mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Nombre</Label>
          <input
            type="text"
            value={form.driver_name}
            onChange={handleChange('driver_name')}
            className="border rounded px-4 py-2 w-full dark:bg-gray-700 dark:text-white"
            maxLength={45}
            placeholder="Nombre"
          />
        </div>

        <div>
          <Label>Apellido</Label>
          <input
            type="text"
            value={form.driver_lastname}
            onChange={handleChange('driver_lastname')}
            className="border rounded px-4 py-2 w-full dark:bg-gray-700 dark:text-white"
            maxLength={45}
            placeholder="Apellido"
          />
        </div>

        <div>
          <Label>Teléfono</Label>
          <input
            type="tel"
            value={form.driver_phonenumber}
            onChange={handleChange('driver_phonenumber')}
            className="border rounded px-4 py-2 w-full dark:bg-gray-700 dark:text-white"
            maxLength={45}
            placeholder="Ej: 60000000"
          />
        </div>

        <div>
          <Label>Correo</Label>
          <input
            type="email"
            value={form.driver_email}
            onChange={handleChange('driver_email')}
            className="border rounded px-4 py-2 w-full dark:bg-gray-700 dark:text-white"
            maxLength={45}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <Label>Provincia</Label>
          <select
            value={form.driver_province}
            onChange={handleChange('driver_province')}
            className="border rounded px-4 py-2 w-full dark:bg-gray-700 dark:text-white"
          >
            <option value={0}>Selecciona una provincia</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.province_name}
              </option>
            ))}
          </select>
        </div>

        <Button variant="primary" size="md" className="w-full">
          Actualizar Conductor
        </Button>
      </form>
    </ComponentCard>
  )
}
