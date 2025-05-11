import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

export default function EcommerceMetrics() {
  const [userCount, setUserCount] = useState(0);
  const [prevUserCount] = useState(3200); // valor anterior simulado

  const [packageCount, setPackageCount] = useState(0);
  const [prevPackageCount] = useState(5800); // valor anterior simulado

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3004";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axios.get(`${apiUrl}/users/users/all`);
        setUserCount(usersRes.data.length);

        const packagesRes = await axios.get(`${apiUrl}/packages/packages/all`);
        setPackageCount(packagesRes.data.length);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [apiUrl]);

  const getChange = (current: number, previous: number): { value: string; up: boolean } => {
    if (previous === 0) return { value: "+100%", up: true };
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    return {
      value: `${percent > 0 ? "+" : ""}${percent.toFixed(2)}%`,
      up: percent >= 0,
    };
  };

  const userChange = getChange(userCount, prevUserCount);
  const packageChange = getChange(packageCount, prevPackageCount);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Customers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {userCount}
            </h4>
          </div>
          <Badge color={userChange.up ? "success" : "error"}>
            {userChange.up ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {userChange.value}
          </Badge>
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Packages
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {packageCount}
            </h4>
          </div>
          <Badge color={packageChange.up ? "success" : "error"}>
            {packageChange.up ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {packageChange.value}
          </Badge>
        </div>
      </div>
    </div>
  );
}
