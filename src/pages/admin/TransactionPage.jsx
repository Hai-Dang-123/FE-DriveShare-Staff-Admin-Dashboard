import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTransactions, getTransactionById } from "../../services/transactionService";

const PAGE_SIZE = 10;

export default function TransactionPage() {
  const navigate = useNavigate();

  // ===== LIST =====
  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // ===== PAGINATION =====
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [pageNumber, setPageNumber] = useState(1);

  // ===== DETAIL =====
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ===== FILTER =====
  const [typeFilter, setTypeFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState(""); // IN | OUT

  // ================= FETCH LIST =================
  const fetchTransactions = async () => {
    setLoadingList(true);
    try {
      const res = await getTransactions({
        pageNumber,
        pageSize: PAGE_SIZE,
      });

      if (res.data?.isSuccess) {
        const pg = res.data.result;
        setTransactions(pg.data || []);
        setPagination(pg);

        if (!selectedId && pg.data?.length > 0) {
          setSelectedId(pg.data[0].transactionId);
          fetchTransactionDetail(pg.data[0].transactionId);
        }
      }
    } catch (err) {
      console.error("Error fetching transactions", err);
    } finally {
      setLoadingList(false);
    }
  };

  // ================= FETCH DETAIL =================
  const fetchTransactionDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const res = await getTransactionById(id);
      if (res.data?.isSuccess) {
        setSelectedTransaction(res.data.result);
      } else {
        setSelectedTransaction(null);
      }
    } catch {
      setSelectedTransaction(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [pageNumber]);

  // ================= FILTERED DATA =================
  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (amountFilter === "IN" && t.amount < 0) return false;
    if (amountFilter === "OUT" && t.amount > 0) return false;
    return true;
  });

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d) ? "-" : d.toLocaleString();
  };

  const amountStyle = (amount) =>
    amount >= 0 ? "text-green-600" : "text-red-600";

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-gray-500">Admin / Transactions</div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: LIST */}
        <div className="col-span-5 bg-white rounded-xl shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <span className="text-sm text-gray-500">
              {pagination.totalCount} total
            </span>
          </div>

          {/* FILTER */}
          <div className="flex gap-2 mb-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Types</option>
              <option value="TOPUP">TOPUP</option>
              <option value="WITHDRAWAL">WITHDRAWAL</option>
              <option value="DRIVER_PAYOUT">DRIVER_PAYOUT</option>
              <option value="OWNER_PAYOUT">OWNER_PAYOUT</option>
            </select>

            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Amount</option>
              <option value="IN">Money In</option>
              <option value="OUT">Money Out</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="flex-1 overflow-y-auto border rounded">
            {loadingList ? (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No transactions found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr
                      key={t.transactionId}
                      onClick={() => {
                        setSelectedId(t.transactionId);
                        fetchTransactionDetail(t.transactionId);
                      }}
                      className={`cursor-pointer border-t ${
                        selectedId === t.transactionId
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-3 py-2 font-medium">{t.type}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${amountStyle(t.amount)}`}>
                        {t.amount >= 0 ? "+" : ""}
                        {t.amount.toLocaleString()} VND
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {formatDate(t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-end items-center gap-3 mt-3">
            <button
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {pagination.currentPage} / {pagination.totalPages || 1}
            </span>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPageNumber((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* RIGHT: DETAIL */}
        <div className="col-span-7 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Transaction Detail</h2>

          {loadingDetail ? (
            <div className="text-sm text-gray-500">Loading detail...</div>
          ) : !selectedTransaction ? (
            <div className="text-sm text-gray-500">Select a transaction.</div>
          ) : (
            <div className="space-y-4 text-sm">
              <Info label="Transaction ID" value={selectedTransaction.transactionId} />
              <Info label="Wallet ID" value={selectedTransaction.walletId} />
              <Info label="Trip ID" value={selectedTransaction.tripId || "-"} />
              <Info label="Type" value={selectedTransaction.type} />
              <Info
                label="Amount"
                value={
                  <span className={amountStyle(selectedTransaction.amount)}>
                    {selectedTransaction.amount.toLocaleString()} VND
                  </span>
                }
              />
              <Info label="Balance Before" value={selectedTransaction.balanceBefore.toLocaleString()} />
              <Info label="Balance After" value={selectedTransaction.balanceAfter.toLocaleString()} />
              <Info label="Status" value={selectedTransaction.status} />
              <Info label="Description" value={selectedTransaction.description || "-"} />
              <Info label="Created At" value={formatDate(selectedTransaction.createdAt)} />
              <Info label="Completed At" value={formatDate(selectedTransaction.completedAt)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
