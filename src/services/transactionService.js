import api from "../configs/api";

export const getTransactions = async ({ pageNumber, pageSize }) => {
  return api.get("/Transaction", {
    params: { pageNumber, pageSize },
  });
};

export const getTransactionById = async (id) => {
  return api.get(`/Transaction/${id}`);
};
