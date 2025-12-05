import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface HistoryRow {
  id: number;
  status_name: string;
  note: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export default function PackageTimeline({ packageId }: { packageId: number }) {
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch(
        `${API_URL}/packages/packages/${packageId}/history`
      );
      const data = await res.json();
      setHistory(data);
    };
    fetchHistory();
  }, [packageId]);

  return (
    <div className="space-y-4">
      {history.map((item, index) => {
        const date = new Date(item.created_at);
        const isLast = index === history.length - 1;

        return (
          <div key={item.id} className="flex gap-3">
            {/* Línea */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  isLast ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              {!isLast && <div className="w-[2px] bg-gray-300 flex-1" />}
            </div>

            {/* Contenido */}
            <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-sm w-full">
              <div className="flex justify-between">
                <p className="font-semibold">{item.status_name}</p>
                <small className="text-gray-400">
                  {date.toLocaleDateString()} {date.toLocaleTimeString()}
                </small>
              </div>

              {item.note && (
                <p className="text-gray-600 dark:text-gray-300 mt-1">{item.note}</p>
              )}

              {item.changed_by_name && (
                <p className="text-xs text-gray-500 mt-1">
                  Por: {item.changed_by_name}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
