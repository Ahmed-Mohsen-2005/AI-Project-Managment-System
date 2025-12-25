import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

class SlackService:
    """Service for Slack integration"""
    
    def __init__(self, integration_id=None):
        """
        Initialize Slack service
        
        Args:
            integration_id: Optional integration ID to load from database
        """
        self.integration_id = integration_id
        self._user_cache = {}
        
        if integration_id:
            # Load from database (placeholder for future implementation)
            self.client = WebClient(token=os.getenv('SLACK_BOT_TOKEN'))
            self.signing_secret = os.getenv('SLACK_SIGNING_SECRET')
        else:
            # Use environment variables
            bot_token = os.getenv('SLACK_BOT_TOKEN')
            if not bot_token:
                raise ValueError("SLACK_BOT_TOKEN environment variable is not set. Please configure it in your .env file.")
            self.client = WebClient(token=bot_token)
            self.signing_secret = os.getenv('SLACK_SIGNING_SECRET')
        
        self.default_channel = os.getenv('SLACK_DEFAULT_CHANNEL', '#general')
    
    def send_message(self, channel, text, user_name=None):
        """
        Send a message to a Slack channel
        
        Args:
            channel: Channel ID or name (e.g., '#general' or 'C1234567890')
            text: Message text
            user_name: Optional username to display
        
        Returns:
            dict: Response from Slack API
        """
        try:
            response = self.client.chat_postMessage(
                channel=channel,
                text=text,
                username=user_name or "AIPMS Bot"
            )
            return {
                "success": True,
                "ts": response['ts'],  # Timestamp/Message ID
                "channel": response['channel']
            }
        except SlackApiError as e:
            print(f"[ERROR] Slack send message failed: {e.response['error']}")
            return {
                "success": False,
                "error": e.response['error']
            }
    
    def get_channel_messages(self, channel, limit=50):
        """
        Get recent messages from a channel
        
        Args:
            channel: Channel ID or name
            limit: Number of messages to retrieve
        
        Returns:
            list: List of messages
        """
        try:
            response = self.client.conversations_history(
                channel=channel,
                limit=limit
            )
            
            messages = []
            user_ids = set()
            
            # Collect all unique user IDs first
            for msg in response['messages']:
                user_id = msg.get('user')
                if user_id:
                    user_ids.add(user_id)
            
            # Batch fetch user info
            user_info_map = self._get_users_info_batch(list(user_ids))
            
            # Build messages with user info
            for msg in response['messages']:
                user_id = msg.get('user', '')
                user_info = user_info_map.get(user_id, {'real_name': 'Unknown', 'email': ''})
                
                messages.append({
                    'text': msg.get('text', ''),
                    'user': user_info.get('real_name', 'Unknown'),
                    'timestamp': msg.get('ts', ''),
                    'time': self._format_timestamp(msg.get('ts', '')),
                })
            
            return messages
        except SlackApiError as e:
            print(f"[ERROR] Slack get messages failed: {e.response['error']}")
            return []
    
    def get_channels(self):
        """
        Get list of all channels the bot has access to
        
        Returns:
            list: List of channels with id and name
        """
        try:
            response = self.client.conversations_list(
                types="public_channel,private_channel"
            )
            
            channels = []
            for channel in response['channels']:
                channels.append({
                    'id': channel['id'],
                    'name': channel['name'],
                    'is_member': channel.get('is_member', False)
                })
            
            return channels
        except SlackApiError as e:
            print(f"[ERROR] Slack get channels failed: {e.response['error']}")
            return []
    
    def _get_users_info_batch(self, user_ids):
        """
        Batch fetch user info for multiple users
        
        Args:
            user_ids: List of user IDs
        
        Returns:
            dict: Map of user_id to user info
        """
        user_info_map = {}
        
        # Check cache first
        uncached_ids = []
        for user_id in user_ids:
            if user_id in self._user_cache:
                user_info_map[user_id] = self._user_cache[user_id]
            else:
                uncached_ids.append(user_id)
        
        if not uncached_ids:
            return user_info_map
        
        # Fetch uncached users in batches (Slack API allows up to 1000 users per call)
        try:
            response = self.client.users_list()
            for user in response['members']:
                user_id = user['id']
                if user_id in uncached_ids:
                    user_info = {
                        'real_name': user.get('real_name', 'Unknown'),
                        'email': user.get('profile', {}).get('email', ''),
                        'avatar': user.get('profile', {}).get('image_72', ''),
                    }
                    self._user_cache[user_id] = user_info
                    user_info_map[user_id] = user_info
        except SlackApiError as e:
            print(f"[ERROR] Slack batch get users failed: {e.response['error']}")
        
        return user_info_map
    
    def get_user_info(self, user_id):
        """
        Get user information from Slack
        
        Args:
            user_id: Slack user ID
        
        Returns:
            dict: User info (name, email, etc.)
        """
        if not user_id:
            return {'real_name': 'Unknown', 'email': ''}
        
        # Check cache first
        if user_id in self._user_cache:
            return self._user_cache[user_id]
        
        try:
            response = self.client.users_info(user=user_id)
            user = response['user']
            user_info = {
                'real_name': user.get('real_name', 'Unknown'),
                'email': user.get('profile', {}).get('email', ''),
                'avatar': user.get('profile', {}).get('image_72', ''),
            }
            # Cache the result
            self._user_cache[user_id] = user_info
            return user_info
        except SlackApiError as e:
            print(f"[ERROR] Slack get user info failed: {e.response['error']}")
            return {'real_name': 'Unknown', 'email': ''}
    
    def _format_timestamp(self, ts):
        """Convert Slack timestamp to readable format"""
        from datetime import datetime
        try:
            timestamp = float(ts)
            dt = datetime.fromtimestamp(timestamp)
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except:
            return ts