import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const parseBRNumber = (str: string) => {
  if (!str) return 0;
  let cleanStr = str.replace(/\./g, '');
  cleanStr = cleanStr.replace(',', '.');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

export default function ImportCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({ total: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleImport = () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setStats({ total: 0 });

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let count = 0;
          const rows = results.data;
          
          const batches = [];
          let currentBatch = writeBatch(db);
          let currentBatchCount = 0;
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Expected indices:
            // row[1] = MV Code
            // row[2] = Name
            // row[6] = Estoque Atual
            const mvCode = row[1]?.trim();
            const name = row[2]?.trim();
            const rawQty = row[6]?.trim();

            if (mvCode && mvCode !== 'Produto' && mvCode !== '' && name) {
              const virtualQty = parseBRNumber(rawQty);
              
              // Validate mvCode against regex
              if (!/^[a-zA-Z0-9_\-]+$/.test(mvCode)) {
                 continue; // Skip invalid IDs
              }

              const docRef = doc(db, 'inventory', mvCode);
              currentBatch.set(docRef, {
                mvCode,
                name,
                virtualQty,
                updatedAt: serverTimestamp()
              });
              
              count++;
              currentBatchCount++;

              if (currentBatchCount >= 400) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                currentBatchCount = 0;
              }
            }
          }

          if (currentBatchCount > 0) {
            batches.push(currentBatch);
          }

          try {
            for (let i = 0; i < batches.length; i++) {
              await batches[i].commit();
              setProgress(Math.round(((i + 1) / batches.length) * 100));
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, `inventory`);
            throw e;
          }

          setStats({ total: count });
          setSuccess(true);
          setProgress(100);
        } catch (err: any) {
          setError(err.message || 'Erro ao importar dados.');
        } finally {
          setIsUploading(false);
        }
      },
      error: (err) => {
        setError('Erro ao ler o arquivo CSV: ' + err.message);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Importar Base CSV</h1>
        <p className="text-gray-500 mt-2">
          Atualize o estoque virtual (Contagem do Farmacêutico) importando o CSV do sistema da farmácia.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <label className="block w-full border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-brand-purple hover:bg-brand-purple/5 transition-colors">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">
            {file ? file.name : 'Clique para selecionar o CSV'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ou arraste e solte o arquivo aqui
          </p>
        </label>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mr-3 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-start">
            <CheckCircle2 className="w-5 h-5 shrink-0 mr-3 mt-0.5" />
            <div>
              <p className="font-medium">Importação concluída com sucesso!</p>
              <p className="text-sm mt-1">{stats.total} medicamentos atualizados na base de dados.</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <div className="flex-1 mr-4">
            {isUploading && (
              <div className="flex items-center text-sm font-medium text-brand-purple">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando... {progress}%
              </div>
            )}
          </div>
          <button
            onClick={handleImport}
            disabled={!file || isUploading}
            className="px-6 py-3 bg-brand-purple text-white font-medium rounded-xl hover:bg-brand-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Importar Dados
          </button>
        </div>
      </div>
    </div>
  );
}
