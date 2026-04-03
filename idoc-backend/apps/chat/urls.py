from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.ChatRoomListView.as_view(), name='chat-rooms'),
    path('rooms/create/', views.create_chat_room, name='chat-room-create'),
    path('rooms/<uuid:room_id>/messages/', views.MessageListView.as_view(), name='chat-messages'),
    path('rooms/<uuid:room_id>/send/', views.send_message, name='chat-send'),
]
