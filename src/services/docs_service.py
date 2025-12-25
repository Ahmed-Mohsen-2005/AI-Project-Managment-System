# services/docs_service.py
import logging
from clients.drive_client import DriveClient, DriveClientError, InsufficientPermissionsError
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)


class DocsServiceError(Exception):
    """Custom exception for DocsService errors"""
    pass


class DocsService:
    def __init__(self):
        """Initialize the DocsService with a DriveClient"""
        try:
            self.client = DriveClient()
        except Exception as e:
            logger.error(f"Failed to initialize DriveClient: {e}")
            raise DocsServiceError(f"Failed to initialize Google Drive client: {e}")

    def list_documents(self, limit=50, sort_by='recent', file_type=None, folder_id=None):
        """
        List documents from Google Drive
        
        Args:
            limit: Maximum number of documents to return
            sort_by: Sort order (recent, name, size)
            file_type: Filter by file type (optional)
            folder_id: Filter by folder ID (optional)
        
        Returns:
            dict with success status and documents list
        """
        try:
            # Map sort_by to Drive API orderBy format
            order_by_map = {
                'recent': 'modifiedTime desc',
                'name': 'name',
                'size': 'quotaBytesUsed desc'
            }
            order_by = order_by_map.get(sort_by, 'modifiedTime desc')
            
            # Map file_type to MIME type (if needed)
            mime_type = None
            if file_type:
                mime_type_map = {
                    'pdf': 'application/pdf',
                    'doc': 'application/vnd.google-apps.document',
                    'sheet': 'application/vnd.google-apps.spreadsheet',
                    'folder': 'application/vnd.google-apps.folder'
                }
                mime_type = mime_type_map.get(file_type)
            
            # Get files from Drive
            documents = self.client.list_files(
                limit=limit,
                order_by=order_by,
                mime_type=mime_type,
                folder_id=folder_id
            )
            
            return {
                'success': True,
                'documents': documents,
                'count': len(documents)
            }
            
        except DriveClientError as e:
            logger.error(f"Drive client error listing documents: {e}")
            return {
                'success': False,
                'error': str(e),
                'documents': []
            }
        except Exception as e:
            logger.error(f"Unexpected error listing documents: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}",
                'documents': []
            }

    def get_document(self, file_id):
        """
        Get a specific document by ID
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            dict with success status and document metadata
        """
        try:
            metadata = self.client.get_file_metadata(file_id)
            
            return {
                'success': True,
                'document': metadata
            }
            
        except DriveClientError as e:
            logger.error(f"Drive client error getting document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error getting document: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def upload_document(self, title, content='', folder_id=None):
        """
        Create a new text document
        
        Args:
            title: Document title/filename
            content: Text content
            folder_id: Parent folder ID (optional)
        
        Returns:
            dict with success status and file info
        """
        try:
            # Ensure filename has .txt extension
            if not title.endswith('.txt'):
                title = f"{title}.txt"
            
            file = self.client.upload_text(
                filename=title,
                content=content,
                folder_id=folder_id
            )
            
            return {
                'success': True,
                'message': 'Document created successfully',
                'file': {
                    'id': file.get('id'),
                    'name': file.get('name'),
                    'mime_type': file.get('mimeType')
                }
            }
            
        except DriveClientError as e:
            logger.error(f"Drive client error creating document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating document: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def upload_file(self, file_obj, folder_id=None):
        """
        Upload a file to Google Drive
        
        Args:
            file_obj: File object from Flask request.files
            folder_id: Parent folder ID (optional)
        
        Returns:
            dict with success status and file info
        """
        try:
            # Secure the filename
            filename = secure_filename(file_obj.filename)
            
            if not filename:
                raise DocsServiceError("Invalid filename")
            
            # Get MIME type
            mime_type = file_obj.content_type or 'application/octet-stream'
            
            # Upload file
            file = self.client.upload_file(
                file_stream=file_obj.stream,
                filename=filename,
                mime_type=mime_type,
                folder_id=folder_id
            )
            
            return {
                'success': True,
                'message': 'File uploaded successfully',
                'file': {
                    'id': file.get('id'),
                    'name': file.get('name'),
                    'mime_type': file.get('mimeType'),
                    'size': file.get('size')
                }
            }
            
        except DriveClientError as e:
            logger.error(f"Drive client error uploading file: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error uploading file: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def download_document(self, file_id):
        """
        Download a document from Google Drive
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            dict with success status, content bytes, and metadata
        """
        try:
            content, metadata = self.client.download_file(file_id)
            
            return {
                'success': True,
                'content': content,
                'metadata': metadata
            }
            
        except DriveClientError as e:
            logger.error(f"Drive client error downloading document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error downloading document: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def rename_document(self, file_id, new_name):
        """
        Rename a document
        
        Args:
            file_id: Google Drive file ID
            new_name: New name for the document
        
        Returns:
            dict with success status and updated file info
        """
        try:
            file = self.client.rename_file(file_id, new_name)
            
            return {
                'success': True,
                'message': 'Document renamed successfully',
                'file': {
                    'id': file.get('id'),
                    'name': file.get('name'),
                    'mime_type': file.get('mimeType')
                }
            }
            
        except InsufficientPermissionsError as e:
            logger.warning(f"Permission denied renaming {file_id}: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'permissions'
            }
        except DriveClientError as e:
            logger.error(f"Drive client error renaming document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error renaming document: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def delete_document(self, file_id):
        """
        Delete a document from Google Drive
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            dict with success status and message
        """
        try:
            self.client.delete_file(file_id)
            
            return {
                'success': True,
                'message': 'Document deleted successfully'
            }
            
        except InsufficientPermissionsError as e:
            logger.warning(f"Permission denied deleting {file_id}: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'permissions'
            }
        except DriveClientError as e:
            logger.error(f"Drive client error deleting document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error deleting document: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def create_folder(self, name, parent_id=None):
        """
        Create a new folder in Google Drive
        
        Args:
            name: Folder name
            parent_id: Parent folder ID (optional)
        
        Returns:
            dict with success status and folder info
        """
        try:
            folder = self.client.create_folder(name, parent_id)
            
            return {
                'success': True,
                'message': 'Folder created successfully',
                'folder': {
                    'id': folder.get('id'),
                    'name': folder.get('name'),
                    'mime_type': folder.get('mimeType')
                }
            }
            
        except DriveClientError as e:
            logger.error(f"Drive client error creating folder: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating folder: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def share_document(self, file_id, email, permission='reader'):
        """
        Share a document with a user
        
        Args:
            file_id: Google Drive file ID
            email: Email address to share with
            permission: Permission level (reader, writer, commenter)
        
        Returns:
            dict with success status
        """
        try:
            # Note: This requires implementing share_file method in DriveClient
            # For now, return a not implemented message
            return {
                'success': False,
                'error': 'Sharing functionality not yet implemented'
            }
            
        except Exception as e:
            logger.error(f"Unexpected error sharing document: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def make_document_public(self, file_id):
        """
        Make a document publicly accessible
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            dict with success status and public link
        """
        try:
            # Note: This requires implementing make_public method in DriveClient
            # For now, return a not implemented message
            return {
                'success': False,
                'error': 'Public sharing functionality not yet implemented'
            }
            
        except Exception as e:
            logger.error(f"Unexpected error making document public: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}"
            }

    def search_documents(self, query, limit=20):
        """
        Search for documents in Google Drive
        
        Args:
            query: Search query string
            limit: Maximum number of results
        
        Returns:
            dict with success status and search results
        """
        try:
            # Build search query for Drive API
            # Search in file name and full text
            drive_query = f"fullText contains '{query}' or name contains '{query}'"
            drive_query += " and trashed = false"
            
            # Use list_files with a custom query
            # Note: This is a simplified implementation
            # You may want to add a search method to DriveClient for better control
            documents = self.client.list_files(
                limit=limit,
                order_by='modifiedTime desc'
            )
            
            # Filter documents by query (client-side filtering as fallback)
            filtered = [
                doc for doc in documents 
                if query.lower() in doc['name'].lower()
            ][:limit]
            
            return {
                'success': True,
                'documents': filtered,
                'count': len(filtered)
            }
            
        except DriveClientError as e:
            logger.error(f"Drive client error searching documents: {e}")
            return {
                'success': False,
                'error': str(e),
                'documents': []
            }
        except Exception as e:
            logger.error(f"Unexpected error searching documents: {e}")
            return {
                'success': False,
                'error': f"An unexpected error occurred: {str(e)}",
                'documents': []
            }