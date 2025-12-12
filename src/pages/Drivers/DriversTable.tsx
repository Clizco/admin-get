import { useEffect, useState, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import Button from '../../components/ui/button/Button'
import Select from '../../components/form/Select'
import { HiPencil, HiTrash } from 'react-icons/hi'

interface Driver {
  id: number
  driver_name: string
  driver_phonenumber: string
  driver_email: string
  driver_province: number
  created_at: string
  vehicle_type: string // 🆕 tipo de vehículo (moto, auto, etc)
}

interface Province {
  id: number
  province_name: string
}

const apiUrl = import.meta.env.VITE_API_URL || ''
const driversUrl = `${apiUrl}/drivers/drivers/all`
const provincesUrl = `${apiUrl}/provinces/provinces/all`

export default function DriverTable() {
  const navigate = useNavigate()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [fade, setFade] = useState(false)

  // filtros
  const [searchText, setSearchText] = useState<string>('')
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('Todos')
  const [selectedDate] = useState<string>('') // reservado si luego quieres filtro por fecha

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversRes, provincesRes] = await Promise.all([
          axios.get<Driver[]>(driversUrl),
          axios.get<Province[]>(provincesUrl),
        ])
        setDrivers(driversRes.data)
        setProvinces(provincesRes.data)
        setTimeout(() => setFade(true), 50)
      } catch (error) {
        console.error('Error fetching drivers or provinces:', error)
      }
    }

    setFade(false)
    fetchData()
  }, [])

  const getProvinceName = (id: number) =>
    provinces.find((p) => p.id === id)?.province_name || 'Desconocido'

  const handleDelete = async (driverId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este conductor?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${apiUrl}/drivers/drivers/delete/${driverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDrivers((prev) => prev.filter((driver) => driver.id !== driverId))
    } catch (error) {
      console.error('Error deleting driver:', error)
    }
  }

  const handleEdit = (driverId: number) => {
    navigate(`/drivers/edit/${driverId}`)
  }

  // construir lista de tipos de vehículo únicos para el filtro
  const vehicleTypeOptions = [
    'Todos',
    ...Array.from(new Set(drivers.map((d) => d.vehicle_type))).sort(),
  ]

  // aplicar filtros en memoria
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.driver_name.toLowerCase().includes(searchText.toLowerCase()) ||
      driver.driver_email.toLowerCase().includes(searchText.toLowerCase()) ||
      driver.driver_phonenumber.toLowerCase().includes(searchText.toLowerCase())

    const matchesProvince =
      selectedProvince === 'Todas' ||
      getProvinceName(driver.driver_province) === selectedProvince

    const matchesVehicleType =
      vehicleTypeFilter === 'Todos' ||
      driver.vehicle_type === vehicleTypeFilter

    const matchesDate =
      !selectedDate ||
      new Date(driver.created_at).toISOString().slice(0, 10) === selectedDate

    return (
      matchesSearch &&
      matchesProvince &&
      matchesVehicleType &&
      matchesDate
    )
  })

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* FILTROS / BUSCADORES */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buscar por nombre / email / teléfono */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Buscar conductor
          </label>
          <input
            type="text"
            placeholder="Ej: Carlos, +507..., correo..."
            value={searchText}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchText(e.target.value)
            }
            className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
          />
        </div>

        {/* Filtrar por provincia */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Provincia
          </label>
          <Select
            className="w-full p-2 border rounded-md dark:bg-white/[0.02] dark:text-white"
            value={selectedProvince}
            onChange={(value: string) => setSelectedProvince(value)}
            options={[
              { value: 'Todas', label: 'Todas' },
              ...provinces.map((prov) => ({
                value: prov.province_name,
                label: prov.province_name,
              })),
            ]}
          />
        </div>

        {/* Filtro por tipo de vehículo */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo de vehículo
          </label>
          <Select
            className="w-full p-2 border rounded-md dark:bg-white/[0.02] dark:text-white"
            value={vehicleTypeFilter}
            onChange={(value: string) => setVehicleTypeFilter(value)}
            options={vehicleTypeOptions.map((value) => ({
              value,
              label:
                value === 'Todos'
                  ? 'Todos'
                  : value.charAt(0).toUpperCase() + value.slice(1),
            }))}
          />
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div
        className={`hidden md:block max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {filteredDrivers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70 p-8">
            No hay conductores registrados.
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Nombre
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Teléfono
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Provincia
                </TableCell>
                {/* 🆕 Tipo de vehículo */}
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Tipo de vehículo
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Fecha de registro
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400"
                >
                  Acción
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                    {driver.driver_name}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                    {driver.driver_phonenumber}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                    {driver.driver_email}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                    {getProvinceName(driver.driver_province)}
                  </TableCell>
                  {/* 🆕 Tipo de vehículo */}
                  <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                    {driver.vehicle_type}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-white">
                    {new Date(driver.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Edit (ícono) */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(driver.id)}
                        aria-label="Editar"
                        className="p-2"
                      >
                        <HiPencil className="w-4 h-4" />
                        <span className="sr-only">Editar</span>
                      </Button>

                      {/* Delete (ícono) */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(driver.id)}
                        aria-label="Eliminar"
                        className="p-2"
                      >
                        <HiTrash className="w-4 h-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div
        className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {filteredDrivers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70">
            No hay conductores registrados.
          </div>
        ) : (
          filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm"
            >
              <p className="text-sm text-gray-700 dark:text-white">
                <strong>Nombre:</strong> {driver.driver_name}
              </p>
              <p className="text-sm text-gray-700 dark:text-white">
                <strong>Teléfono:</strong> {driver.driver_phonenumber}
              </p>
              <p className="text-sm text-gray-700 dark:text-white">
                <strong>Email:</strong> {driver.driver_email}
              </p>
              <p className="text-sm text-gray-700 dark:text-white">
                <strong>Provincia:</strong> {getProvinceName(driver.driver_province)}
              </p>
              <p className="text-sm text-gray-700 dark:text-white">
                <strong>Vehículo:</strong> {driver.vehicle_type}
              </p>
              <p className="text-sm text-gray-700 dark:text-white">
                <strong>Fecha:</strong>{' '}
                {new Date(driver.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </p>

              <div className="mt-3 flex gap-2">
                {/* Edit (ícono) */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(driver.id)}
                  aria-label="Editar"
                  className="p-2"
                >
                  <HiPencil className="w-4 h-4" />
                  <span className="sr-only">Editar</span>
                </Button>

                {/* Delete (ícono) */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(driver.id)}
                  aria-label="Eliminar"
                  className="p-2"
                >
                  <HiTrash className="w-4 h-4" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
