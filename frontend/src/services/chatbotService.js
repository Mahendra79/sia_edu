import api from "./api";

export const chatbotService = {
  sendMessage(payload) {
    return api.post("/chatbot/message/", payload, { timeout: 180000 });
  },
  evaluate(payload) {
    return api.post("/chatbot/evaluate/", payload, { timeout: 180000 });
  },
};
