import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface CountSession {
  id: string;
  createdAt: { seconds: number, nanoseconds: number } | Date;
  status: string;
  userEmail?: string;
}

interface CountItem {
  id: string;
  mvCode: string;
  name: string;
  virtualQty: number;
  physicalQty: number;
  divergence: number;
}

export default function CountHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CountSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemsMap, setItemsMap] = useState<Record<string, CountItem[]>>({});
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchSessions() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'daily_counts')
        );
        const snap = await getDocs(q);
        const fetchedSessions: CountSession[] = [];
        snap.forEach(doc => {
          fetchedSessions.push({ id: doc.id, ...doc.data() } as CountSession);
        });
        
        // Sort client-side since standard queries without composite index block orderBy after where
        fetchedSessions.sort((a, b) => {
          const timeA = (a.createdAt as any)?.seconds || 0;
          const timeB = (b.createdAt as any)?.seconds || 0;
          return timeB - timeA;
        });
        
        setSessions(fetchedSessions);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.LIST, 'daily_counts');
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [user]);

  const toggleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    
    if (!itemsMap[sessionId]) {
      setItemsLoading(prev => ({ ...prev, [sessionId]: true }));
      try {
        const snap = await getDocs(collection(db, `daily_counts/${sessionId}/items`));
        const items: CountItem[] = [];
        snap.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() } as CountItem);
        });
        items.sort((a, b) => a.name.localeCompare(b.name));
        setItemsMap(prev => ({ ...prev, [sessionId]: items }));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `daily_counts/${sessionId}/items`);
      } finally {
        setItemsLoading(prev => ({ ...prev, [sessionId]: false }));
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data desconhecida';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="flex h-64 justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Histórico de Contagens</h1>
        <p className="text-gray-500 mt-2">
          Visualize os registros de contagens físicas diárias passadas.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum histórico de contagem encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <div key={session.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleExpand(session.id)}
                className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-brand-purple/10 p-3 rounded-xl text-brand-purple">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-lg">
                      Contagem de {formatDate(session.createdAt)} {session.userEmail ? `por ${session.userEmail}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: <span className="capitalize">{session.status === 'completed' ? 'Concluída' : session.status}</span>
                    </p>
                  </div>
                </div>
                {expandedId === session.id ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
              </button>
              
              {expandedId === session.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                  {itemsLoading[session.id] ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
                    </div>
                  ) : (
                    <div>
                      <div className="hidden md:grid grid-cols-12 gap-4 pb-2 border-b border-gray-200 font-medium text-gray-500 text-sm mb-2">
                        <div className="col-span-2">MV</div>
                        <div className="col-span-4">Descrição</div>
                        <div className="col-span-2 text-right">Virtual</div>
                        <div className="col-span-2 text-right">Física</div>
                        <div className="col-span-2 text-right">Divergência</div>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                        {itemsMap[session.id]?.map((item) => (
                          <div key={item.id} className="py-3 grid grid-cols-1 md:grid-cols-12 gap-y-2 gap-x-4 items-center">
                            <div className="md:col-span-2 font-mono text-sm text-gray-500 flex justify-between">
                              <span className="md:hidden font-medium">MV:</span>
                              {item.mvCode}
                            </div>
                            <div className="md:col-span-4 font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="md:col-span-2 text-sm text-gray-600 flex justify-between md:justify-end">
                              <span className="md:hidden font-medium">Virtual:</span>
                              {item.virtualQty}
                            </div>
                            <div className="md:col-span-2 text-sm text-gray-600 flex justify-between md:justify-end">
                              <span className="md:hidden font-medium">Física:</span>
                              {item.physicalQty}
                            </div>
                            <div className={`md:col-span-2 text-sm font-semibold flex justify-between md:justify-end ${item.divergence === 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="md:hidden font-medium">Divergência:</span>
                              {item.divergence > 0 ? '+' : ''}{item.divergence}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
