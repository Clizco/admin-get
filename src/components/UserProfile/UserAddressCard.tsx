import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { getUser } from "../../utils/common";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "axios";

interface Address {
  id?: number;
  address_person_fullname: string;
  address_phonenumber: string;
  address_details: string;
  address_province: number;
  address_user: number;
}

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [address, setAddress] = useState<Address>({
    address_person_fullname: "",
    address_phonenumber: "",
    address_details: "",
    address_province: 0,
    address_user: 0,
  });

  const user = getUser();
  const userId = user?.id;
  const selectedAddressId = user?.user_address;

  useEffect(() => {
    const fetchAddress = async () => {
      if (!userId || !selectedAddressId) return;

      try {
        const response = await axios.get<Address[]>(
          `http://localhost:3004/address/address/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const addresses = response.data;

        const selected = addresses.find(
          (addr) => addr.id === selectedAddressId
        );

        if (selected) {
          setAddress({
            address_person_fullname: selected.address_person_fullname,
            address_phonenumber: selected.address_phonenumber,
            address_details: selected.address_details,
            address_province: selected.address_province,
            address_user: selected.address_user,
          });
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }
    };

    fetchAddress();
  }, [userId, selectedAddressId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:3004/address/address/update/${address.id}`,
        address,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // 🔄 Opcional: obtener usuario actualizado desde backend
      const updatedUser = await axios.get(
        `http://localhost:3004/users/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      localStorage.setItem(
        "decodedToken",
        JSON.stringify(updatedUser.data)
      );

      closeModal();
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Address
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Full Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {address.address_person_fullname}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Phone Number
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {address.address_phonenumber}
                </p>
              </div>

              <div className="lg:col-span-2">
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Address Details
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {address.address_details}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Editar
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar Dirección
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Actualiza tus detalles para mantener tu perfil al día.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Label>Nombre</Label>
                  <Input
                    name="address_person_fullname"
                    type="text"
                    value={address.address_person_fullname}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label>Teléfono</Label>
                  <Input
                    name="address_phonenumber"
                    type="text"
                    value={address.address_phonenumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label>Detalles de la Dirección</Label>
                  <Input
                    name="address_details"
                    type="text"
                    value={address.address_details}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cerrar
              </Button>
              <Button size="sm" onClick={handleSave}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
