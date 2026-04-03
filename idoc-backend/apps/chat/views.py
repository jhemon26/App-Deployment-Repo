from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from apps.accounts.permissions import IsActiveAndNotBlocked, IsApprovedBusinessUser


class ChatRoomListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = ChatRoomSerializer

    def get_queryset(self):
        return ChatRoom.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages')

    def get_serializer_context(self):
        return {'request': self.request}


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser])
def create_chat_room(request):
    """Create or get existing chat room between two users."""
    other_user_id = request.data.get('user_id')
    if not other_user_id:
        return Response({'error': 'user_id is required'}, status=400)

    # Check if room already exists
    existing = ChatRoom.objects.filter(
        participants=request.user
    ).filter(
        participants=other_user_id
    ).first()

    if existing:
        return Response(ChatRoomSerializer(existing, context={'request': request}).data)

    room = ChatRoom.objects.create()
    room.participants.add(request.user.id, other_user_id)
    return Response(
        ChatRoomSerializer(room, context={'request': request}).data,
        status=status.HTTP_201_CREATED
    )


class MessageListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = MessageSerializer

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        # Mark messages as read
        Message.objects.filter(
            room_id=room_id, is_read=False
        ).exclude(sender=self.request.user).update(is_read=True)

        return Message.objects.filter(
            room_id=room_id
        ).select_related('sender').order_by('created_at')


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser])
def send_message(request, room_id):
    """Send a message via REST (fallback when WebSocket is unavailable)."""
    content = request.data.get('content', '')
    message_type = request.data.get('message_type', 'text')

    if not content:
        return Response({'error': 'Content is required'}, status=400)

    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found'}, status=404)

    message = Message.objects.create(
        room=room,
        sender=request.user,
        content=content,
        message_type=message_type,
    )
    room.save()  # Update timestamp

    return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
