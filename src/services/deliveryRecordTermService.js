import api from "../configs/api";

const DeliveryRecordTermService = {
  getByTemplate: (templateId, page = 1, pageSize = 50) =>
    api.get(
      `/DeliveryRecordTerm/${templateId}/terms?pageNumber=${page}&pageSize=${pageSize}`
    ),

  getById: (id) => api.get(`/DeliveryRecordTerm/terms/${id}`),

  create: (data) => api.post(`/DeliveryRecordTerm/terms`, data),

  update: (id, data) => api.put(`/DeliveryRecordTerm/terms/${id}`, data),

  delete: (id) => api.delete(`/DeliveryRecordTerm/terms/${id}`),
};

export default DeliveryRecordTermService;
