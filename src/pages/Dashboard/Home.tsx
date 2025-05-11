import PageMeta from "../../components/common/PageMeta";
import { useEffect, useState } from "react";
import { getUser } from "../../utils/common";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";

interface CommonUser {
  id: number;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_phonenumber: string;
  user_province: string | number;
  user_prefix: string;
  user_address: string | number;
}

export default function Home() {
  const [user, setUser] = useState<CommonUser | null>(null);

  useEffect(() => {
    const currentUser = getUser() as CommonUser | null;
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  return (
    <>
      <PageMeta
        title="Mi Perfil - Get."
        description="Esta es la página de inicio mostrando la información del usuario en PBE."
      />

      <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          ¡Hola, {user ? `${user.user_firstname}` : "Usuario"}!
        </h1>
      </div>
      
      <EcommerceMetrics />

      
    </>
  );
}
