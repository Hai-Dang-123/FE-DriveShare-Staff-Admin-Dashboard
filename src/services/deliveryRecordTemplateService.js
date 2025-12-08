import api from "../configs/api";

const DeliveryRecordTemplateService = {
  getAll: (page = 1, pageSize = 50) =>
    api.get(`/DeliveryRecordTemplate?pageNumber=${page}&pageSize=${pageSize}`),

  getById: (id) => api.get(`/DeliveryRecordTemplate/${id}`),

  create: (data) => api.post(`/DeliveryRecordTemplate`, data),

  update: (id, data) => api.put(`/DeliveryRecordTemplate/${id}`, data),

  delete: (id) => api.delete(`/DeliveryRecordTemplate/${id}`),
};

export default DeliveryRecordTemplateService;
