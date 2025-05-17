import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Toaster } from "react-hot-toast"; // 💥 Agregado
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import PublicRoutes from "./utils/publicRoutes";
import PrivateRoutes from "./utils/privateRoutes";
import InstallButton from "./components/installbutton/installbutton";
import ShipmentTable from "./pages/Shipments/ShipmentTable";
import AddressBook from "./pages/Adresses/AdressTable";
import PackageTable from "./pages/Packages/PackagesTable";
import Calculator from "./pages/Calculator/calculator";
import DriverTable from "./pages/Drivers/DriversTable";
import UserTable from "./pages/Users/UsersTable";
import UserDetail from "./pages/Users/UserDetail";
export default function App() {
  return (
    <Router>
      <InstallButton />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
          },
        }}
      />
      <ScrollToTop />
      <Routes>

        {/* Rutas privadas (requieren login) */}
        <Route element={<PrivateRoutes />}>
          <Route element={<AppLayout />}>
            {/* Dashboard */}
            <Route index path="/" element={<Home />} />

            {/* Otras páginas */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/shipments" element={<ShipmentTable />} />
            <Route path="/addresses" element={<AddressBook />} />
            <Route path="/packages" element={<PackageTable />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/drivers" element={<DriverTable />} />
            <Route path="/users" element={<UserTable />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/unauthorized" element={<div>No tienes permiso para acceder</div>} />



            {/* Rutas anidadas */}

            {/* Formularios */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tablas */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Componentes UI */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Gráficos */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>
        </Route>

        {/* Rutas públicas */}
        <Route element={<PublicRoutes />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Ruta de error (404) */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}
