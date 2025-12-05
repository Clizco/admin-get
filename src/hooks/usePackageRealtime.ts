import { useEffect } from "react";
import { socket } from "../lib/socket";

interface PackageStatusEvent {
  packageId: number;
  status_id: number;
  origin?: string;
}

export function usePackageRealtime(onUpdate: (ev: PackageStatusEvent) => void) {
  useEffect(() => {
    socket.on("package_status_changed", onUpdate);

    return () => {
      socket.off("package_status_changed", onUpdate);
    };
  }, [onUpdate]);
}
