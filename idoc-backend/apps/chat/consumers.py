import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'Invalid JSON'}))
            return

        message_type = data.get('type', 'chat_message')

        if message_type == 'chat_message':
            message = data.get('message')
            sender_id = data.get('sender_id')
            sender_name = data.get('sender_name', 'User')

            if not message or not sender_id:
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Missing message or sender_id'}))
                return

            try:
                # Save message to database
                saved_msg = await self.save_message(sender_id, message)

                # Broadcast to room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender_id': sender_id,
                        'sender_name': sender_name,
                        'message_id': str(saved_msg.id),
                        'timestamp': saved_msg.created_at.isoformat(),
                    }
                )
            except Exception as e:
                await self.send(text_data=json.dumps({'type': 'error', 'message': str(e)}))
        elif message_type == 'typing':
            sender_id = data.get('sender_id')
            sender_name = data.get('sender_name', 'User')
            if sender_id:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_typing',
                        'sender_id': sender_id,
                        'sender_name': sender_name,
                    }
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'message_id': event['message_id'],
            'timestamp': event['timestamp'],
        }))

    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_typing',
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
        }))

    @database_sync_to_async
    def save_message(self, sender_id, content):
        from .models import ChatRoom, Message
        User = get_user_model()
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            sender = User.objects.get(id=sender_id)
            message = Message.objects.create(
                room=room,
                sender=sender,
                content=content,
            )
            room.save()  # Update updated_at
            return message
        except ChatRoom.DoesNotExist:
            raise ValueError(f'Chat room {self.room_id} not found')
        except User.DoesNotExist:
            raise ValueError(f'User {sender_id} not found')


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.group_name = f'notifications_{self.user_id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event['data']))
