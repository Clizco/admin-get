import { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  product_weight: string;
  product_unit: string;
  product_description: string;
  product_value: string;
  product_store: string;
}

interface Package {
  id: number;
  package_tracking_id: string;
  package_status: string;
  created_at: string;
  invoice_path?: string;
  products: Product[];
  user_id: number;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_prefix: string;
  user_fullname: string;
}

const apiUrl = import.meta.env.VITE_API_URL || '';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function PackageTable() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Package[]>(
        `${apiUrl}/packages/packages/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching package data:', error);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDownloadInvoice = (invoicePath: string) => {
    const fullUrl = `${apiUrl}${invoicePath}`;
    window.open(fullUrl, '_blank');
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.user_fullname.toLowerCase().includes(filter.toLowerCase()) ||
    pkg.user_email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filtro */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Filtrar por cliente o email..."
          value={filter}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-white/[0.1] dark:text-white"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Creado</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Tracking</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Estado</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Factura</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Productos</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-sm text-gray-500 font-medium dark:text-gray-400">Cliente</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filteredPackages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="px-5 py-3 text-start text-sm text-gray-500 dark:text-gray-300">{formatDate(pkg.created_at)}</TableCell>
                <TableCell className="px-5 py-3 text-start text-blue-600 dark:text-blue-400 font-medium">{pkg.package_tracking_id}</TableCell>
                <TableCell className="px-5 py-3 text-start text-sm text-gray-500 dark:text-gray-300">
                  <Badge
                    size="sm"
                    color={
                      pkg.package_status === 'Active' ? 'success' :
                      pkg.package_status === 'Pending' ? 'warning' : 'error'
                    }
                  >
                    {pkg.package_status}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3 text-start">
                  {pkg.invoice_path ? (
                    <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(pkg.invoice_path!)}>Descargar</Button>
                  ) : (
                    <span className="text-gray-400 text-sm">Sin factura</span>
                  )}
                </TableCell>
                <TableCell className="px-5 py-3 text-start text-sm text-gray-500 dark:text-gray-300">
                  <table className="w-full text-sm text-left border-collapse border border-gray-300 dark:border-white/[0.1]">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-white/[0.05]">
                        <th className="px-2 py-1 border dark:border-white/[0.1]">Peso</th>
                        <th className="px-2 py-1 border dark:border-white/[0.1]">Descripción</th>
                        <th className="px-2 py-1 border dark:border-white/[0.1]">Valor</th>
                        <th className="px-2 py-1 border dark:border-white/[0.1]">Tienda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pkg.products.map((product, index) => (
                        <tr key={index}>
                          <td className="px-2 py-1 border dark:border-white/[0.1]">{product.product_weight} {product.product_unit}</td>
                          <td className="px-2 py-1 border dark:border-white/[0.1]">{product.product_description}</td>
                          <td className="px-2 py-1 border dark:border-white/[0.1]">${parseFloat(product.product_value).toFixed(2)}</td>
                          <td className="px-2 py-1 border dark:border-white/[0.1]">{product.product_store}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCell>
                <TableCell className="px-5 py-3 text-start text-sm text-gray-700 dark:text-gray-200">
                  <button
                    onClick={() => navigate(`/users/${pkg.user_id}`)}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {pkg.user_fullname}
                  </button>
                  <div className="text-xs">{pkg.user_email}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{pkg.user_prefix}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden p-4 space-y-4">
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Fecha:</strong> {formatDate(pkg.created_at)}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium"><strong>Tracking:</strong> {pkg.package_tracking_id}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Estado:</strong> <Badge size="sm" color={pkg.package_status === 'Active' ? 'success' : pkg.package_status === 'Pending' ? 'warning' : 'error'}>{pkg.package_status}</Badge>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              <strong>Factura:</strong> {pkg.invoice_path ? (
                <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(pkg.invoice_path!)}>Descargar</Button>
              ) : <span className="text-gray-400">Sin factura</span>}
            </p>
            <div className="space-y-2">
              {pkg.products.map((product, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-white/[0.1] p-2 rounded-md text-sm text-gray-800 dark:text-gray-100">
                  <p><strong>Peso:</strong> {product.product_weight} {product.product_unit}</p>
                  <p><strong>Descripción:</strong> {product.product_description}</p>
                  <p><strong>Valor:</strong> ${parseFloat(product.product_value).toFixed(2)}</p>
                  <p><strong>Tienda:</strong> {product.product_store}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <p><strong>Cliente:</strong> <button onClick={() => navigate(`/users/${pkg.user_id}`)} className="text-blue-600 hover:underline dark:text-blue-400">{pkg.user_fullname}</button></p>
              <p><strong>Email:</strong> {pkg.user_email}</p>
              <p><strong>Prefix:</strong> {pkg.user_prefix}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
