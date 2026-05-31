import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useLang } from '../../LangContext';

// ── Category translations ──────────────────────────────────────────────────

const CATEGORY_RU: Record<string, string> = {
  rent: 'Аренда',
  food: 'Еда',
  chemicals: 'Химия',
  salary: 'Зарплата',
  maintenance: 'Обслуживание',
  utilities: 'Коммунальные',
};

const CATEGORY_EN: Record<string, string> = {
  rent: 'Rent',
  food: 'Food',
  chemicals: 'Chemicals',
  salary: 'Salary',
  maintenance: 'Maintenance',
  utilities: 'Utilities',
};

// ── Types ───────────────────────────────────────────────────────────────────

interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
}

interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
}

// ── Summary card component ──────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number;
  variant: 'income' | 'expense' | 'balance';
}

function SummaryCard({ label, value, variant }: SummaryCardProps) {
  const bgMap = {
    income: 'bg-green-50 border-green-200',
    expense: 'bg-red-50 border-red-200',
    balance: value >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200',
  };
  const iconBgMap = {
    income: 'bg-green-500',
    expense: 'bg-red-500',
    balance: value >= 0 ? 'bg-green-500' : 'bg-red-500',
  };
  const textMap = {
    income: 'text-green-700',
    expense: 'text-red-700',
    balance: value >= 0 ? 'text-green-700' : 'text-red-700',
  };
  const iconChar = variant === 'income' ? '↑' : variant === 'expense' ? '↓' : '═';

  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${bgMap[variant]}`}>
      <div
        className={`${iconBgMap[variant]} w-14 h-14 rounded-lg flex items-center justify-center text-white text-2xl font-bold shrink-0`}
      >
        {iconChar}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${textMap[variant]}`}>
          {variant === 'expense' ? '-' : value >= 0 && variant === 'balance' ? '+' : ''}
          {Math.abs(value).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function FinancePage() {
  const { RL } = useLang();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, txData] = await Promise.all([
        api.get<FinanceSummary>('/finance/summary'),
        api.get<Transaction[]>('/finance'),
      ]);
      setSummary(summaryData);
      setTransactions(txData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : RL('error');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [RL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-500">{RL('loading')}</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label={RL('income')} value={summary.income} variant="income" />
          <SummaryCard label={RL('expense')} value={summary.expense} variant="expense" />
          <SummaryCard label="Balance" value={summary.balance} variant="balance" />
        </div>
      )}

      {/* Transactions table */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Transactions</h3>
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{tx.date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {RL(tx.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{tx.category}</td>
                    <td className="px-5 py-3 text-gray-500">{tx.description}</td>
                    <td className="px-5 py-3 text-right font-medium whitespace-nowrap">
                      <span className={tx.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                        {tx.type === 'income' ? '+' : '-'}
                        {tx.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
