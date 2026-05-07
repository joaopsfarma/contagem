import { Link } from 'react-router-dom';
import { FileSpreadsheet, ClipboardList } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [totalItems, setTotalItems] = useState<number | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const snap = await getDocs(collection(db, 'inventory'));
        setTotalItems(snap.size);
      } catch (err) {
        // Suppress initial errors if rules block it, though rules shouldn't.
        console.error(err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel de Controle</h1>
        <p className="text-gray-500 mt-2">Bem-vindo(a) ao sistema de contagem da farmácia.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/import" className="group">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden h-full">
            <div className="bg-brand-purple/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-brand-purple group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">1. Importar CSV</h2>
            <p className="text-gray-500 mt-2">
              Importe o arquivo CSV com a base do sistema. Isso preencherá as quantidades virtuais.
            </p>
            {totalItems !== null && (
              <div className="mt-6 pt-4 border-t border-gray-50">
                <p className="text-sm font-medium text-brand-purple">
                  {totalItems} produtos na base.
                </p>
              </div>
            )}
          </div>
        </Link>

        <Link to="/pharmacist-count" className="group">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden h-full">
            <div className="bg-brand-green/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">2. Contagem do Farmacêutico</h2>
            <p className="text-gray-500 mt-2">
              Faça a contagem completa de todos os itens cadastrados no estoque importado.
            </p>
          </div>
        </Link>

        <Link to="/count" className="group">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden h-full">
            <div className="bg-brand-purple/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-brand-purple group-hover:scale-110 transition-transform">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">3. Contagem Diária</h2>
            <p className="text-gray-500 mt-2">
              Faça a contagem física diária restrita aos psicotrópicos selecionados.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
