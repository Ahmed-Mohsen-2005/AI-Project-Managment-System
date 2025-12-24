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
        
        # Get the base directory (project root) - where app.py is located
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.credentials_path = os.path.join(self.base_dir, 'credentials.json')
        self.token_path = os.path.join(self.base_dir, 'token.json')
        
        self._authenticate()

    def _authenticate(self):
        """Handle OAuth2 authentication"""
        try:
            # The file token.json stores the user's access and refresh tokens
            if os.path.exists(self.token_path):
                self.creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
            
            # If there are no (valid) credentials available, let the user log in.
            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                else:
                    # distinct check for credentials.json existence
                    if not os.path.exists(self.credentials_path):
                        raise DriveClientError(
                            f"credentials.json not found at {self.credentials_path}. "
                            f"Please download it from Google Cloud Console and place it in the project root."
                        )
                        
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, SCOPES)
                    self.creds = flow.run_local_server(port=0)
                
                # Save the credentials for the next run
                with open(self.token_path, 'w') as token:
                    token.write(self.creds.to_json())

            self.service = build('drive', 'v3', credentials=self.creds)

        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise DriveClientError(f"Authentication failed: {e}")

    def list_files(self, limit=50, order_by='modifiedTime desc', mime_type=None, folder_id=None):
        """List files from Drive"""
        try:
            query = "trashed = false"
            
            # Filter by folder
            if folder_id:
                query += f" and '{folder_id}' in parents"
            
            # Filter by mime type
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

    def _is_google_doc(self, mime_type):
        """Check if the file is a Google Workspace document"""
        google_doc_types = [
            'application/vnd.google-apps.document',
            'application/vnd.google-apps.spreadsheet',
            'application/vnd.google-apps.presentation',
            'application/vnd.google-apps.drawing'
        ]
        return mime_type in google_doc_types

    def _get_export_mime_type(self, google_mime_type):
        """Get the appropriate export MIME type for Google Workspace files"""
        export_map = {
            'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
            'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # .xlsx
            'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',  # .pptx
            'application/vnd.google-apps.drawing': 'application/pdf'  # .pdf
        }
        return export_map.get(google_mime_type, 'application/pdf')

    def _get_export_extension(self, google_mime_type):
        """Get the file extension for exported Google Workspace files"""
        extension_map = {
            'application/vnd.google-apps.document': '.docx',
            'application/vnd.google-apps.spreadsheet': '.xlsx',
            'application/vnd.google-apps.presentation': '.pptx',
            'application/vnd.google-apps.drawing': '.pdf'
        }
        return extension_map.get(google_mime_type, '.pdf')

    def download_file(self, file_id):
        """Download file content - handles both regular files and Google Docs"""
        try:
            # First, get the file metadata to check its type
            metadata = self.get_file_metadata(file_id)
            mime_type = metadata['mime_type']
            
            # Check if it's a Google Workspace document
            if self._is_google_doc(mime_type):
                # Export Google Docs
                export_mime_type = self._get_export_mime_type(mime_type)
                request = self.service.files().export_media(
                    fileId=file_id,
                    mimeType=export_mime_type
                )
                
                file_io = io.BytesIO()
                downloader = MediaIoBaseDownload(file_io, request)
                
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                
                # Add the appropriate extension to the filename
                extension = self._get_export_extension(mime_type)
                if not metadata['name'].endswith(extension):
                    metadata['name'] = metadata['name'] + extension
                    metadata['mime_type'] = export_mime_type
                
                return file_io.getvalue(), metadata
            else:
                # Download regular binary files
                request = self.service.files().get_media(fileId=file_id)
                file_io = io.BytesIO()
                downloader = MediaIoBaseDownload(file_io, request)
                
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                
                return file_io.getvalue(), metadata
            
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
            'application/vnd.google-apps.spreadsheet': 'Google Sheet',
            'application/vnd.google-apps.presentation': 'Google Slides',
            'application/vnd.google-apps.drawing': 'Google Drawing'
        }
        # Default to generic type or Image if it starts with image/
        if mime_type and mime_type.startswith('image/'):
            return 'Image'
        return mapping.get(mime_type, 'File')