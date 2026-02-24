import api from "./api";

export const deletedRecordService = {
  getDeletedRecords(params) {
    return api.get("/deleted-records/", { params });
  },
};
