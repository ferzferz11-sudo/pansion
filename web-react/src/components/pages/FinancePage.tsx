import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { useLang } from '../../LangContext';

interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
}

interface Transaction {
  id: string;
  created_at: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
}

const CATEGORY_LABELS: Record<string, { ru: string; en: string }> = {
  rent: { ru: 'Проживание', en: 'Rent' },
  food: { ru: 'Питание', en: 'Food' },
  chemicals: { ru: 'Химия', en: 'Chemicals' },
  salary: { ru: 'Зарплата', en: 'Salary' },
  maintenance: { ru: 'Обслуживание', en: 'Maintenance' },
  utilities: { ru: 'Коммунальные', en: 'Utilities' },
  other: { ru: 'Другое', en: 'Other' },
};

export default function FinancePage() {
  const { RL, lang } = useLang();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, tx] = await Promise.all([
        api.get<any>('/finance/summary'),
        api.get<Transaction[]>('/finance'),
      ]);
      setSummary(s.finance);
      setTransactions(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : RL('error'));
    } finally {
      setLoading(false);
    }
  }, [RL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getCatLabel = (cat: string) => CATEGORY_LABELS[cat]?.[lang] || cat;

  if (loading) return <div className="text-center py-8 text-gray-400">{RL('loading')}</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{RL('finance')}</h2>

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center gap-4">
              <div className="bg-green-500 text-white font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center shrink-0">↑</div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{RL('income')}</p>
                <p className="text-2xl font-bold text-green-700">+{summary.income.toLocaleString()}</p>
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-center gap-4">
              <div className="bg-red-500 text-white font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center shrink-0">↓</div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{RL('expense')}</p>
                <p className="text-2xl font-bold text-red-700">-{summary.expense.toLocaleString()}</p>
              </div>
            </div>
            <div className={`rounded-xl border p-5 flex items-center gap-4 ${summary.balance >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className={`text-white font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${summary.balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>═</div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{RL('balance')}</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Visual bar chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{RL('financeSummary')}</h3>
            <div className="space-y-3">
              {(() => {
                const max = Math.max(summary.income, summary.expense, 1);
                const incomePct = (summary.income / max) * 100;
                const expensePct = (summary.expense / max) * 100;
                return (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{RL('income')}</span>
                        <span className="font-medium text-green-700">+{summary.income.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${incomePct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{RL('expense')}</span>
                        <span className="font-medium text-red-700">-{summary.expense.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="bg-red-500 h-3 rounded-full transition-all" style={{ width: `${expensePct}%` }} />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{RL('balance')}</span>
                        <span className={`font-bold ${summary.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{RL('transactions')}</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{RL('noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">{RL('date')}</th>
                  <th className="px-5 py-3 font-medium">{RL('type')}</th>
                  <th className="px-5 py-3 font-medium">{RL('category')}</th>
                  <th className="px-5 py-3 font-medium">{RL('description')}</th>
                  <th className="px-5 py-3 font-medium text-right">{RL('amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{tx.created_at}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {RL(tx.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{getCatLabel(tx.category)}</td>
                    <td className="px-5 py-3 text-gray-500">{tx.description}</td>
                    <td className="px-5 py-3 text-right font-medium whitespace-nowrap">
                      <span className={tx.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
