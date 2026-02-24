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
};
