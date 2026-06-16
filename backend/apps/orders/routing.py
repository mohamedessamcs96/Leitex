from django.urls import re_path
from .consumers import POSConsumer

websocket_urlpatterns = [
    re_path(r'ws/pos/$', POSConsumer.as_asgi()),
]
