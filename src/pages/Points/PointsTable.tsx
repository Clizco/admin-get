import { useEffect, useMemo, useState, ChangeEvent } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Button from "../../components/ui/button/Button";

type UserRow = {
  id: number;
  user_firstname?: string;
  user_lastname?: string;
  user_email: string;
  user_phonenumber?: string;
  created_at?: string;
};

type BalanceInfo = {
  user_id: number;
  balance: number;
  updated_at: string | null;
};

type LedgerRow = {
  id: number;
  user_id: number;
  delta: number;
  reason: string | null;
  source: string | null;
  meta: any;                 // puede venir string o JSON
  expires_at: string | null;
  created_at: string;
};

const apiUrl = import.meta.env.VITE_API_URL || "";
const usersUrl = `${apiUrl}/users/users/all`;
const pointsGrantUrl = `${apiUrl}/points/points/grant`;
const pointsBalanceUrl = (userId: number) => `${apiUrl}/points/points/${userId}/balance`;
const pointsLedgerUrl  = (userId: number, limit=20, offset=0) =>
  `${apiUrl}/points/points/${userId}/ledger?limit=${limit}&offset=${offset}`;

export default function PointsTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [balances, setBalances] = useState<Record<number, BalanceInfo>>({});
  const [loading, setLoading] = useState(false);
  const [fade, setFade] = useState(false);

  // filtros
  const [searchText, setSearchText] = useState<string>("");

  // mini-form “Dar puntos”
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [grantAmount, setGrantAmount] = useState<string>("");
  const [grantReason, setGrantReason] = useState<string>("");
  const [grantLoading, setGrantLoading] = useState<boolean>(false);

  // MODAL de movimientos
  const [ledgerOpenUserId, setLedgerOpenUserId] = useState<number | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerLimit] = useState(20);
  const [ledgerOffset, setLedgerOffset] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const { data: usersData } = await axios.get<UserRow[]>(usersUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setUsers(usersData ?? []);

        const balancesPairs = await Promise.all(
          (usersData ?? []).map(async (u) => {
            try {
              const { data } = await axios.get<BalanceInfo>(pointsBalanceUrl(u.id), {
                headers: token
                  ? { Authorization: `Bearer ${token}`, "x-access-token": token }
                  : undefined,
              });
              return [u.id, data] as const;
            } catch {
              return [u.id, { user_id: u.id, balance: 0, updated_at: null } as BalanceInfo] as const;
            }
          })
        );
        const map: Record<number, BalanceInfo> = {};
        for (const [id, info] of balancesPairs) map[id] = info;
        setBalances(map);
      } catch (e) {
        console.error("Error cargando usuarios/balances:", e);
      } finally {
        setLoading(false);
        setTimeout(() => setFade(true), 50);
      }
    };

    setFade(false);
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const fullName = `${u.user_firstname ?? ""} ${u.user_lastname ?? ""}`.trim();
      return (
        fullName.toLowerCase().includes(q) ||
        (u.user_email ?? "").toLowerCase().includes(q) ||
        (u.user_phonenumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, searchText]);

  const displayName = (u: UserRow) =>
    `${u.user_firstname ?? ""} ${u.user_lastname ?? ""}`.trim() || u.user_email;

  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("es-PA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const getBalance = (userId: number) => balances[userId]?.balance ?? 0;
  const getUpdatedAt = (userId: number) => balances[userId]?.updated_at ?? null;

  const openGrantFor = (userId: number) => {
    setOpenRow((curr) => (curr === userId ? null : userId));
    setGrantAmount("");
    setGrantReason("");
  };

  const handleGrant = async (userId: number) => {
    const amt = parseInt(grantAmount, 10);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Ingresa un monto válido mayor a 0");
      return;
    }

    try {
      setGrantLoading(true);
      const token = localStorage.getItem("token");
      const body = {
        user_id: userId,
        delta: amt,
        reason: grantReason || "compra",
        source: "admin",
      };

      const { data } = await axios.post(pointsGrantUrl, body, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              "x-access-token": token,
              "Content-Type": "application/json",
            }
          : { "Content-Type": "application/json" },
      });

      // actualizar balance local
      setBalances((prev) => ({
        ...prev,
        [userId]: {
          user_id: userId,
          balance: data?.balance ?? (prev[userId]?.balance ?? 0) + amt,
          updated_at: data?.updated_at ?? new Date().toISOString(),
        },
      }));

      // si el modal del usuario está abierto, refrescamos su ledger
      if (ledgerOpenUserId === userId) {
        await fetchLedger(userId, ledgerLimit, ledgerOffset);
      }

      setOpenRow(null);
      setGrantAmount("");
      setGrantReason("");
    } catch (err: any) {
      console.error("Error otorgando puntos:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al otorgar puntos";
      alert(msg);
    } finally {
      setGrantLoading(false);
    }
  };

  async function fetchLedger(userId: number, limit = 20, offset = 0) {
    try {
      setLedgerLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get<LedgerRow[]>(pointsLedgerUrl(userId, limit, offset), {
        headers: token
          ? { Authorization: `Bearer ${token}`, "x-access-token": token }
          : undefined,
      });

      // Normaliza meta (string -> JSON si aplica)
      const normalized: LedgerRow[] = (data ?? []).map((r) => {
        let meta: any = r.meta;
        try {
          if (typeof meta === "string") meta = JSON.parse(meta);
        } catch {
          meta = { raw: r.meta };
        }
        return { ...r, meta };
      });

      setLedger(normalized);
    } catch (e) {
      console.error("Error obteniendo ledger:", e);
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  }

  const openLedgerModal = async (userId: number) => {
    setLedgerOpenUserId(userId);
    setLedgerOffset(0);
    await fetchLedger(userId, ledgerLimit, 0);
  };

  const closeLedgerModal = () => {
    setLedgerOpenUserId(null);
    setLedger([]);
  };

  const nextPage = async () => {
    if (ledgerOpenUserId == null) return;
    const newOffset = ledgerOffset + ledgerLimit;
    setLedgerOffset(newOffset);
    await fetchLedger(ledgerOpenUserId, ledgerLimit, newOffset);
  };

  const prevPage = async () => {
    if (ledgerOpenUserId == null) return;
    const newOffset = Math.max(0, ledgerOffset - ledgerLimit);
    setLedgerOffset(newOffset);
    await fetchLedger(ledgerOpenUserId, ledgerLimit, newOffset);
  };

  const totals = useMemo(() => {
    const sumIn = ledger.filter(l => l.delta > 0).reduce((a,b) => a + b.delta, 0);
    const sumOut = ledger.filter(l => l.delta < 0).reduce((a,b) => a + Math.abs(b.delta), 0);
    return { sumIn, sumOut };
  }, [ledger]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* BUSCADOR */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Buscar usuario
          </label>
        <input
            type="text"
            placeholder="Nombre, correo o teléfono"
            value={searchText}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchText(e.target.value)
            }
            className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
          />
        </div>

        <div />

        <div className="flex items-end justify-end">
          {loading && (
            <span className="text-sm text-gray-500 dark:text-white/60">
              Cargando…
            </span>
          )}
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div
        className={`hidden md:block max-w-full overflow-x-auto p-4 transition-opacity duration-500 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70 p-8">
            No hay usuarios
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">
                  Usuario
                </TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">
                  Email
                </TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">
                  Teléfono
                </TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">
                  Saldo (pts)
                </TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">
                  Actualizado
                </TableCell>
                <TableCell isHeader className="text-start text-gray-500 font-medium text-theme-xs dark:text-gray-400">
                  Acción
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filtered.map((u) => {
                const isOpen = openRow === u.id;
                return (
                  <FragmentRow
                    key={u.id}
                    user={u}
                    isOpen={isOpen}
                    displayName={displayName(u)}
                    email={u.user_email}
                    phone={u.user_phonenumber || "-"}
                    balance={getBalance(u.id)}
                    updatedAt={getUpdatedAt(u.id)}
                    onOpen={() => openGrantFor(u.id)}
                    onViewLedger={() => openLedgerModal(u.id)}
                    grantAmount={grantAmount}
                    setGrantAmount={setGrantAmount}
                    grantReason={grantReason}
                    setGrantReason={setGrantReason}
                    onGrant={() => handleGrant(u.id)}
                    grantLoading={grantLoading}
                  />
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div
        className={`block md:hidden p-4 space-y-4 transition-opacity duration-500 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-white/70">
            No hay usuarios
          </div>
        ) : (
          filtered.map((u) => {
            const isOpen = openRow === u.id;
            return (
              <div
                key={u.id}
                className="border rounded-lg p-4 text-sm bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.05] space-y-2"
              >
                <p className="text-gray-700 dark:text-white">
                  <strong>Usuario:</strong> {displayName(u)}
                </p>
                <p className="text-gray-700 dark:text-white">
                  <strong>Email:</strong> {u.user_email}
                </p>
                <p className="text-gray-700 dark:text-white">
                  <strong>Teléfono:</strong> {u.user_phonenumber || "-"}
                </p>
                <p className="text-gray-700 dark:text-white">
                  <strong>Saldo:</strong> {getBalance(u.id)} pts
                </p>
                <p className="text-gray-700 dark:text-white">
                  <strong>Actualizado:</strong>{" "}
                  {getUpdatedAt(u.id) ? formatDate(getUpdatedAt(u.id)!) : "-"}
                </p>

                <div className="pt-2 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => openGrantFor(u.id)}
                  >
                    Dar puntos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openLedgerModal(u.id)}
                  >
                    Ver movimientos
                  </Button>
                </div>

                {isOpen && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="Cantidad (ej: 100)"
                        value={grantAmount}
                        onChange={(e) => setGrantAmount(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Motivo (opcional)"
                        value={grantReason}
                        onChange={(e) => setGrantReason(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        disabled={grantLoading}
                        onClick={() => handleGrant(u.id)}
                      >
                        {grantLoading ? "Guardando..." : "Confirmar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenRow(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL LEDGER */}
      {ledgerOpenUserId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeLedgerModal} />
          <div className="relative z-[61] w-[95%] max-w-3xl rounded-2xl bg-white dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/[0.06] shadow-lg">
            <div className="p-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Movimientos de puntos — Usuario #{ledgerOpenUserId}
              </h3>
              <Button size="sm" variant="outline" onClick={closeLedgerModal}>
                Cerrar
              </Button>
            </div>

            <div className="p-4">
              {/* Totales rápidos */}
              <div className="mb-3 text-sm text-gray-700 dark:text-white/80 flex gap-4">
                <span><strong>Acreditado:</strong> +{totals.sumIn} pts</span>
                <span><strong>Canjeado:</strong> -{totals.sumOut} pts</span>
              </div>

              <div className="max-h-[60vh] overflow-auto rounded-lg border border-gray-100 dark:border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-white/[0.03]">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Δ Pts</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Motivo</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Fuente</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Meta</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Expira</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {ledgerLoading ? (
                      <tr><td className="p-4 text-gray-500 dark:text-white/70" colSpan={6}>Cargando…</td></tr>
                    ) : ledger.length === 0 ? (
                      <tr><td className="p-4 text-gray-500 dark:text-white/70" colSpan={6}>Sin movimientos</td></tr>
                    ) : (
                      ledger.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.03]">
                          <td className="p-3 text-gray-800 dark:text-white">{formatDate(m.created_at)}</td>
                          <td className={`p-3 font-semibold ${m.delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {m.delta >= 0 ? `+${m.delta}` : m.delta}
                          </td>
                          <td className="p-3 text-gray-800 dark:text-white">{m.reason ?? "-"}</td>
                          <td className="p-3 text-gray-800 dark:text-white">{m.source ?? "-"}</td>
                          <td className="p-3 text-gray-700 dark:text-white/80">
                            <code className="text-xs break-words">
                              {m.meta && typeof m.meta === "object" ? JSON.stringify(m.meta) : (m.meta ?? "-")}
                            </code>
                          </td>
                          <td className="p-3 text-gray-800 dark:text-white">{m.expires_at ? formatDate(m.expires_at) : "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-white/50">
                  offset {ledgerOffset} · limit {ledgerLimit}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={prevPage} disabled={ledgerOffset === 0 || ledgerLoading}>
                    Anterior
                  </Button>
                  <Button size="sm" variant="outline" onClick={nextPage} disabled={ledgerLoading || ledger.length < ledgerLimit}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fila compuesta para desktop con subfila del mini-form */
function FragmentRow(props: {
  user: UserRow;
  isOpen: boolean;
  displayName: string;
  email: string;
  phone: string;
  balance: number;
  updatedAt: string | null;
  onOpen: () => void;
  onViewLedger: () => void;
  grantAmount: string;
  setGrantAmount: (v: string) => void;
  grantReason: string;
  setGrantReason: (v: string) => void;
  onGrant: () => void;
  grantLoading: boolean;
}) {
  const {
    isOpen,
    displayName,
    email,
    phone,
    balance,
    updatedAt,
    onOpen,
    onViewLedger,
    grantAmount,
    setGrantAmount,
    grantReason,
    setGrantReason,
    onGrant,
    grantLoading,
  } = props;

  return (
    <>
      <TableRow>
        <TableCell className="text-gray-700 dark:text-white">{displayName}</TableCell>
        <TableCell className="text-gray-700 dark:text-white">{email}</TableCell>
        <TableCell className="text-gray-700 dark:text-white">{phone}</TableCell>
        <TableCell className="text-gray-700 dark:text-white">{balance}</TableCell>
        <TableCell className="text-gray-700 dark:text-white">
          {updatedAt
            ? new Date(updatedAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-"}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={onOpen}
            >
              Dar puntos
            </Button>
            <Button size="sm" variant="outline" onClick={onViewLedger}>
              Ver movimientos
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isOpen && (
        <TableRow>
          <td colSpan={6}>
            <div className="rounded-md border p-3 bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.05]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="number"
                  min={1}
                  placeholder="Cantidad (ej: 100)"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Motivo (opcional)"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={grantLoading}
                    onClick={onGrant}
                  >
                    {grantLoading ? "Guardando..." : "Confirmar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => (window as any).setOpenRow?.(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
                Se registrará un movimiento en el ledger y se actualizará el saldo del usuario
              </p>
            </div>
          </td>
        </TableRow>
      )}
    </>
  );
}
