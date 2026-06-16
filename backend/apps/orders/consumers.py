import json
from channels.generic.websocket import AsyncWebsocketConsumer


class POSConsumer(AsyncWebsocketConsumer):
    """
    Single WebSocket consumer for all POS real-time updates.
    Clients connect and join the 'pos_updates' group.
    Messages are broadcast from Django views via channel layers.
    """
    GROUP = 'pos_updates'

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({'type': 'connected', 'message': 'LightPOS real-time connected'}))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.GROUP, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """Accept ping / client-initiated events."""
        try:
            data = json.loads(text_data or '{}')
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    # Handler called by channel_layer.group_send
    async def pos_message(self, event):
        await self.send(text_data=json.dumps({
            'event': event['event'],
            'data':  event['data'],
        }))
