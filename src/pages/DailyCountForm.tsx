import { useEffect, useState } from 'react';
import { collection, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InventoryItem {
  mvCode: string;
  name: string;
  virtualQty: number;
}

const REQUIRED_MV_CODES = [
  '187', '202157', '208909', '2460', '2463', '11347', '36811', '2420', '1457',
  '3285', '1496', '1498', '1523', '1524', '1594', '12544', '1175', '74210',
  '94979', '74517', '19600', '2317', '12427', '1318', '2490', '201140',
  '19918', '3500', '892', '210356', '210355', '1184', '37123', '12116',
  '12134', '11409', '213103', '110545'
];

export default function DailyCountForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [physicalCounts, setPhysicalCounts] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const snap = await getDocs(collection(db, 'inventory'));
        const loadedItems: InventoryItem[] = [];
        snap.forEach(docSnap => {
          const data = docSnap.data() as InventoryItem;
          if (REQUIRED_MV_CODES.includes(data.mvCode)) {
            loadedItems.push(data);
          }
        });
        
        loadedItems.sort((a, b) => a.name.localeCompare(b.name));
        setItems(loadedItems);
        
        // Init state
        const initialCounts: { [key: string]: string } = {};
        loadedItems.forEach(item => {
          initialCounts[item.mvCode] = '';
        });
        setPhysicalCounts(initialCounts);
      } catch (err: any) {
        setError("Erro ao carregar o estoque. Você importou o CSV primeiro? " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const handleChange = (mvCode: string, value: string) => {
    setPhysicalCounts(prev => ({ ...prev, [mvCode]: value }));
  };

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      const countRef = doc(collection(db, 'daily_counts'));
      const countId = countRef.id;

      batch.set(countRef, {
        createdAt: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email || 'unknown',
        status
      });

      for (const item of items) {
        const physValStr = physicalCounts[item.mvCode];
        const physicalQty = physValStr === '' ? 0 : parseFloat(physValStr);
        const divergence = physicalQty - item.virtualQty;

        const itemRef = doc(db, `daily_counts/${countId}/items`, item.mvCode);
        batch.set(itemRef, {
          countId,
          mvCode: item.mvCode,
          name: item.name,
          virtualQty: item.virtualQty,
          physicalQty,
          divergence
        });
      }

      await batch.commit();
      navigate('/history');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'daily_counts');
      setError('Erro ao salvar contagem: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Estoque Vazio</h2>
        <p className="text-gray-500 mb-6">Nenhum produto encontrado. Por favor, importe a base do farmacêutico primeiro (Arquivo CSV).</p>
        <button onClick={() => navigate('/import')} className="px-6 py-3 bg-brand-purple text-white rounded-xl font-medium hover:bg-brand-green transition-colors">
          Ir para Importação
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Registro de Contagem Diária</h1>
        <p className="text-gray-500 mt-2">
          Insira a quantidade física de cada medicamento. A divergência é calculada automaticamente ao salvar.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 shrink-0 mr-3 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 font-medium text-gray-500 text-sm">
          <div className="col-span-2">MV</div>
          <div className="col-span-8">Descrição</div>
          <div className="col-span-2 text-right">Qtde. Física</div>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.mvCode} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-y-3 gap-x-4 items-center hover:bg-gray-50/30 transition-colors">
              <div className="md:col-span-2 font-mono text-sm text-gray-500 flex justify-between">
                <span className="md:hidden font-medium">Código:</span>
                {item.mvCode}
              </div>
              <div className="md:col-span-8 font-medium text-gray-900">
                {item.name}
              </div>
              <div className="md:col-span-2 flex justify-end">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={physicalCounts[item.mvCode]}
                  onChange={(e) => handleChange(item.mvCode, e.target.value)}
                  className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple text-right"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 shrink-0 z-10 flex justify-end space-x-4">
        <button
          onClick={() => handleSave('completed')}
          disabled={saving}
          className="px-8 py-3 bg-brand-purple text-white font-medium rounded-xl hover:bg-brand-green disabled:opacity-50 flex items-center shadow-sm transition-colors"
        >
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Finalizar Contagem
        </button>
      </div>
    </div>
  );
}
