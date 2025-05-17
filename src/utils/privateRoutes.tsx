// src/utils/PrivateRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "./common";

const PrivateRoutes = () => {
  const token = getToken();
  const userData = localStorage.getItem("decodedToken");

  if (!token || !userData) {
    return <Navigate to="/signin" replace />;
  }

  try {
    const user = JSON.parse(userData);
    if (user.role_id === 1) {
      return <Outlet />;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  } catch (error) {
    console.error("Error al parsear los datos del usuario:", error);
    return <Navigate to="/signin" replace />;
  }
};

export default PrivateRoutes;
