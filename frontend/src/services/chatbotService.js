import api from "./api";

export const chatbotService = {
  sendMessage(payload) {
    return api.post("/chatbot/message/", payload);
  },
  evaluate(payload) {
    return api.post("/chatbot/evaluate/", payload);
  },
};
