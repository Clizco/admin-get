import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useModal } from "../../hooks/useModal"
import { getUser } from "../../utils/common"
import { Modal } from "../ui/modal"
import Input from "../form/input/InputField"
import Label from "../form/Label"
import Button from "../ui/button/Button"

interface CommonUser {
  id: number
  user_firstname: string
  user_lastname: string
  user_email: string
  user_phonenumber: string
  user_province: string | number
  user_address: string | number
}

interface Province {
  id: number
  province_name: string
}

interface Address {
  id: number
  address_name: string
}

const apiUrl = import.meta.env.VITE_API_URL || ""
const provincesUrl = `${apiUrl}/provinces/provinces/all`
const addressesUrl = `${apiUrl}/address/address/all`

export default function UserInfoCard() {
  const navigate = useNavigate()
  const { isOpen, openModal, closeModal } = useModal()

  const [user, setUser] = useState<CommonUser | null>(
    () => getUser() as CommonUser | null
  )
  const [provinces, setProvinces] = useState<Province[]>([])
  const [, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Campos editables (igual que en el driver)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [province, setProvince] = useState<string | number>("")
  const [address, setAddress] = useState<string | number>("")

  // Prellenar campos a partir de getUser()
  useEffect(() => {
    if (!user) return
    setFirstName(user.user_firstname || "")
    setLastName(user.user_lastname || "")
    setPhone(user.user_phonenumber || "")
    setProvince(user.user_province ?? "")
    setAddress(user.user_address ?? "")
  }, [user])

  // Cargar provincias + direcciones (como en tu ejemplo)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [provRes, addrRes] = await Promise.all([
          axios.get<Province[]>(provincesUrl),
          axios.get<Address[]>(addressesUrl),
        ])
        setProvinces(provRes.data)
        setAddresses(addrRes.data)
      } catch (error) {
        console.error("Error loading data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    if (!user) return
    try {
      setSaving(true)

      const updateUrl = `${apiUrl}/users/users/update/${user.id}`

      const payload = {
        user_firstname: firstName.trim(),
        user_lastname: lastName.trim(),
        user_email: user.user_email, // email no lo editamos aquí
        user_phonenumber: phone.trim(),
        user_province: province,
        user_address: address,
      }

      await axios.post(updateUrl, payload)

      // Refrescar el estado local del usuario
      setUser((prev) =>
        prev
          ? {
              ...prev,
              user_firstname: payload.user_firstname,
              user_lastname: payload.user_lastname,
              user_phonenumber: payload.user_phonenumber,
              user_province: payload.user_province,
              user_address: payload.user_address,
            }
          : prev
      )

      alert("Información actualizada con éxito")
      closeModal()
      navigate("/dashboard")
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Error al actualizar la información")
    } finally {
      setSaving(false)
    }
  }

  const provinceName = (val?: string | number) => {
    if (val === undefined || val === null || val === "") return ""
    const id = Number(val)
    const p = provinces.find((x) => x.id === id)
    return p ? p.province_name : ""
  }


  const fullName = user
    ? `${user.user_firstname} ${user.user_lastname}`.trim()
    : "—"

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cargando…
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="text-xs text-gray-500">Nombre Completo</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {fullName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Correo Electrónico</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {user?.user_email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {user?.user_phonenumber || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Provincia</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {provinceName(user?.user_province) || "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          Editar
        </button>
      </div>

      {/* Modal de edición */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="bg-white p-6 rounded-3xl dark:bg-gray-900">
          <h4 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white/90">
            Editar Información Personal
          </h4>

          <form
            className="grid grid-cols-1 gap-5 lg:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <div>
              <Label>Nombre</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <Label>Correo Electrónico</Label>
              <div className="w-full border rounded p-2 bg-gray-100 text-gray-600 text-sm">
                {user?.user_email || ""}
              </div>
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label>Provincia</Label>
              <select
                className="w-full border rounded p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              >
                <option value="">Seleccionar provincia</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.province_name}
                  </option>
                ))}
              </select>
            </div>
          </form>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" size="sm" onClick={closeModal}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
