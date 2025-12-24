import os.path
import io
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive']

class DriveClientError(Exception):
    """Custom exception for Drive Client errors"""
    pass

class DriveClient:
    def __init__(self):
        """Initialize the Drive API client"""
        self.creds = None
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Handle OAuth2 authentication"""
        try:
            # The file token.json stores the user's access and refresh tokens
            if os.path.exists('token.json'):
                self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)
            
            # If there are no (valid) credentials available, let the user log in.
            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                else:
                    # distinct check for credentials.json existence
                    if not os.path.exists('credentials.json'):
                        raise DriveClientError("credentials.json not found. Please download it from Google Cloud Console.")
                        
                    flow = InstalledAppFlow.from_client_secrets_file(
                        'credentials.json', SCOPES)
                    self.creds = flow.run_local_server(port=0)
                
                # Save the credentials for the next run
                with open('token.json', 'w') as token:
                    token.write(self.creds.to_json())

            self.service = build('drive', 'v3', credentials=self.creds)

        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise DriveClientError(f"Authentication failed: {e}")

    def list_files(self, limit=50, order_by='modifiedTime desc', mime_type=None):
        """List files from Drive"""
        try:
            query = "trashed = false"
            if mime_type:
                query += f" and mimeType = '{mime_type}'"

            results = self.service.files().list(
                pageSize=limit,
                fields="nextPageToken, files(id, name, mimeType, modifiedTime, size, parents, webContentLink, webViewLink)",
                q=query,
                orderBy=order_by
            ).execute()
            
            items = results.get('files', [])
            
            # Normalize data structure for service layer
            normalized = []
            for item in items:
                normalized.append({
                    'id': item.get('id'),
                    'name': item.get('name'),
                    'mime_type': item.get('mimeType'),
                    'modified_at': item.get('modifiedTime'),
                    'size': item.get('size'),
                    'type': self._map_mime_to_type(item.get('mimeType')),
                    'web_link': item.get('webViewLink')
                })
            
            return normalized

        except HttpError as error:
            raise DriveClientError(f"An error occurred listing files: {error}")

    def upload_text(self, filename, content, folder_id=None):
        """Upload a text string as a file"""
        try:
            file_metadata = {'name': filename}
            if folder_id:
                file_metadata['parents'] = [folder_id]

            # Convert string to bytes stream
            media = MediaIoBaseUpload(
                io.BytesIO(content.encode('utf-8')),
                mimetype='text/plain',
                resumable=True
            )

            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, mimeType'
            ).execute()
            
            return file

        except HttpError as error:
            raise DriveClientError(f"An error occurred uploading text: {error}")

    def upload_file(self, file_stream, filename, mime_type, folder_id=None):
        """Upload a binary file stream"""
        try:
            file_metadata = {'name': filename}
            if folder_id:
                file_metadata['parents'] = [folder_id]

            media = MediaIoBaseUpload(
                file_stream,
                mimetype=mime_type,
                resumable=True
            )

            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, mimeType, size'
            ).execute()
            
            return file

        except HttpError as error:
            raise DriveClientError(f"An error occurred uploading file: {error}")

    def get_file_metadata(self, file_id):
        """Get file details"""
        try:
            file = self.service.files().get(
                fileId=file_id,
                fields="id, name, mimeType, modifiedTime, size, parents, webViewLink, owners"
            ).execute()
            
            # Normalize
            return {
                'id': file.get('id'),
                'name': file.get('name'),
                'mime_type': file.get('mimeType'),
                'modified_at': file.get('modifiedTime'),
                'size': file.get('size'),
                'type': self._map_mime_to_type(file.get('mimeType')),
                'owners': [o.get('emailAddress') for o in file.get('owners', [])]
            }
        except HttpError as error:
            raise DriveClientError(f"An error occurred getting metadata: {error}")

    def download_file(self, file_id):
        """Download file content"""
        try:
            request = self.service.files().get_media(fileId=file_id)
            file_io = io.BytesIO()
            downloader = MediaIoBaseDownload(file_io, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            return file_io.getvalue()
            
        except HttpError as error:
            raise DriveClientError(f"An error occurred downloading: {error}")

    def delete_file(self, file_id):
        """Delete a file"""
        try:
            self.service.files().delete(fileId=file_id).execute()
            return True
        except HttpError as error:
            raise DriveClientError(f"An error occurred deleting: {error}")

    def rename_file(self, file_id, new_name):
        """Rename a file"""
        try:
            file_metadata = {'name': new_name}
            file = self.service.files().update(
                fileId=file_id,
                body=file_metadata,
                fields='id, name, mimeType'
            ).execute()
            return file
        except HttpError as error:
            raise DriveClientError(f"An error occurred renaming: {error}")

    def create_folder(self, folder_name, parent_id=None):
        """Create a new folder"""
        try:
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            if parent_id:
                file_metadata['parents'] = [parent_id]

            file = self.service.files().create(
                body=file_metadata,
                fields='id, name, mimeType'
            ).execute()
            return file
        except HttpError as error:
            raise DriveClientError(f"An error occurred creating folder: {error}")

    def _map_mime_to_type(self, mime_type):
        """Helper to map MIME types to user friendly names"""
        mapping = {
            'application/vnd.google-apps.folder': 'Folder',
            'application/pdf': 'PDF',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
            'text/plain': 'Text',
            'application/vnd.google-apps.document': 'Google Doc',
            'application/vnd.google-apps.spreadsheet': 'Google Sheet'
        }
        # Default to generic type or Image if it starts with image/
        if mime_type and mime_type.startswith('image/'):
            return 'Image'
        return mapping.get(mime_type, 'File')