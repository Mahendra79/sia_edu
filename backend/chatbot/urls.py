from django.urls import path

from chatbot.views import ChatbotEvaluationView, ChatbotMessageView


urlpatterns = [
    path("message/", ChatbotMessageView.as_view(), name="chatbot-message"),
    path("evaluate/", ChatbotEvaluationView.as_view(), name="chatbot-evaluate"),
]
