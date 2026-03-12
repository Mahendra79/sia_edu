import api from "./api";

export const analyticsService = {
  getSummary() {
    return api.get("/analytics/summary/");
  },
  getDashboard() {
    return api.get("/analytics/dashboard/");
  },
  getActivityLogs(params) {
    return api.get("/analytics/activity-logs/", { params });
  },
  getAdminDbTables() {
    return api.get("/analytics/admin/db/tables/");
  },
  getAdminDbRows(tableKey, params) {
    return api.get(`/analytics/admin/db/table/${tableKey}/rows/`, { params });
  },
  updateAdminDbRow(tableKey, pk, payload) {
    return api.patch(`/analytics/admin/db/table/${tableKey}/row/${pk}/`, payload);
  },
  deleteAdminDbRow(tableKey, pk) {
    return api.delete(`/analytics/admin/db/table/${tableKey}/row/${pk}/`);
  },
};
