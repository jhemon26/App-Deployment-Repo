from rest_framework import serializers
from .models import ChatRoom, Message
from apps.accounts.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_detail = UserSerializer(source='sender', read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['id', 'sender', 'created_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    participants_detail = UserSerializer(source='participants', many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = '__all__'

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {'content': msg.content, 'sender': msg.sender.name, 'time': msg.created_at}
        return None

    def get_unread_count(self, obj):
        user = self.context.get('request', {})
        if hasattr(user, 'user'):
            return obj.messages.filter(is_read=False).exclude(sender=user.user).count()
        return 0
