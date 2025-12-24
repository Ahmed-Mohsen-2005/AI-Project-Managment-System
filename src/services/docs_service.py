# services/docs_service.py
from clients.drive_client import DriveClient, DriveClientError
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DocsServiceError(Exception):
    """Custom exception for docs service errors"""
    pass


class DocsService:
    """
    Documentation Service Layer
    Handles business logic for document management
    Acts as a bridge between controllers and Google Drive client
    """
    
    def __init__(self):
        """Initialize service with Drive client"""
        try:
            self.drive_client = DriveClient()
        except DriveClientError as e:
            logger.error(f"Failed to initialize Drive client: {e}")
            raise DocsServiceError(f"Drive initialization failed: {str(e)}")
    
    # ===== DOCUMENT LISTING =====
    
    def list_documents(self, limit=50, sort_by='recent', file_type=None):
        """
        Get list of documents with optional filtering
        
        Args:
            limit: Maximum number of documents to return
            sort_by: Sort order ('recent', 'name', 'size')
            file_type: Filter by file type (e.g., 'PDF', 'Word')
        
        Returns:
            Dictionary with documents list and metadata
        """
        try:
            # Map sort options to Drive API order
            order_map = {
                'recent': 'modifiedTime desc',
                'name': 'name',
                'size': 'quotaBytesUsed desc'
            }
            order_by = order_map.get(sort_by, 'modifiedTime desc')
            
            # Map file type to MIME type if specified
            mime_type = self._get_mime_type_filter(file_type)
            
            # Get files from Drive
            files = self.drive_client.list_files(
                limit=limit,
                order_by=order_by,
                mime_type=mime_type
            )
            
            # Add service-level enrichment
            enriched_files = [self._enrich_document(file) for file in files]
            
            return {
                'success': True,
                'count': len(enriched_files),
                'documents': enriched_files,
                'timestamp': datetime.now().isoformat()
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error listing documents: {e}")
            return {
                'success': False,
                'error': str(e),
                'documents': []
            }
        except Exception as e:
            logger.error(f"Unexpected error listing documents: {e}")
            raise DocsServiceError(f"Failed to list documents: {str(e)}")
    
    def _get_mime_type_filter(self, file_type):
        """Map user-friendly file type to MIME type"""
        if not file_type:
            return None
        
        type_map = {
            'PDF': 'application/pdf',
            'Word': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Text': 'text/plain',
            'Image': 'image/*',
            'Google Doc': 'application/vnd.google-apps.document',
            'Google Sheet': 'application/vnd.google-apps.spreadsheet'
        }
        
        return type_map.get(file_type)
    
    def _enrich_document(self, file_data):
        """
        Add service-level metadata to document
        E.g., relative time, user-friendly formatting
        """
        enriched = file_data.copy()
        
        # Add relative time (e.g., "2 days ago")
        if file_data.get('modified_at'):
            enriched['modified_relative'] = self._get_relative_time(
                file_data['modified_at']
            )
        
        # Add file icon class based on type
        enriched['icon'] = self._get_file_icon(file_data.get('type'))
        
        # Add safety flag for display
        enriched['is_safe_to_preview'] = self._is_safe_to_preview(
            file_data.get('mime_type')
        )
        
        return enriched
    
    def _get_relative_time(self, iso_timestamp):
        """Convert ISO timestamp to relative time (e.g., '2 hours ago')"""
        try:
            from dateutil import parser
            file_time = parser.parse(iso_timestamp)
            now = datetime.now(file_time.tzinfo)
            diff = now - file_time
            
            seconds = diff.total_seconds()
            
            if seconds < 60:
                return "Just now"
            elif seconds < 3600:
                minutes = int(seconds / 60)
                return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            elif seconds < 86400:
                hours = int(seconds / 3600)
                return f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif seconds < 604800:
                days = int(seconds / 86400)
                return f"{days} day{'s' if days > 1 else ''} ago"
            else:
                weeks = int(seconds / 604800)
                return f"{weeks} week{'s' if weeks > 1 else ''} ago"
                
        except Exception:
            return "Unknown"
    
    def _get_file_icon(self, file_type):
        """Get Font Awesome icon class for file type"""
        icon_map = {
            'PDF': 'fa-file-pdf',
            'Word': 'fa-file-word',
            'Excel': 'fa-file-excel',
            'Text': 'fa-file-alt',
            'Image': 'fa-file-image',
            'Google Doc': 'fa-file-alt',
            'Google Sheet': 'fa-table',
            'Folder': 'fa-folder',
        }
        return icon_map.get(file_type, 'fa-file')
    
    def _is_safe_to_preview(self, mime_type):
        """Check if file type is safe to preview in browser"""
        safe_types = [
            'application/pdf',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/vnd.google-apps.document',
            'application/vnd.google-apps.spreadsheet'
        ]
        return mime_type in safe_types if mime_type else False
    
    # ===== DOCUMENT UPLOAD =====
    
    def upload_document(self, title, content, folder_id=None):
        """
        Upload text content as a document
        
        Args:
            title: Document title/filename
            content: Text content
            folder_id: Optional folder ID
        
        Returns:
            Dictionary with upload result
        """
        try:
            # Validate inputs
            if not title or not title.strip():
                return {
                    'success': False,
                    'error': 'Title is required'
                }
            
            if not content:
                content = ""  # Allow empty documents
            
            # Sanitize filename
            safe_title = self._sanitize_filename(title)
            
            # Upload to Drive
            result = self.drive_client.upload_text(
                filename=safe_title,
                content=content,
                folder_id=folder_id
            )
            
            logger.info(f"Document uploaded: {result['id']}")
            
            return {
                'success': True,
                'message': f'Document "{safe_title}" uploaded successfully',
                'document': result
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error uploading document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error uploading document: {e}")
            raise DocsServiceError(f"Failed to upload document: {str(e)}")
    
    def upload_file(self, file_obj, filename=None, folder_id=None):
        """
        Upload a file object (from Flask request.files)
        
        Args:
            file_obj: File object from Flask upload
            filename: Optional custom filename (uses original if not provided)
            folder_id: Optional folder ID
        
        Returns:
            Dictionary with upload result
        """
        try:
            # Validate file object
            if not file_obj:
                return {
                    'success': False,
                    'error': 'No file provided'
                }
            
            # Get filename
            upload_name = filename or file_obj.filename
            if not upload_name:
                return {
                    'success': False,
                    'error': 'Filename is required'
                }
            
            # Sanitize filename
            safe_name = self._sanitize_filename(upload_name)
            
            # Get MIME type
            mime_type = file_obj.content_type or 'application/octet-stream'
            
            # Validate file size (optional - adjust limit as needed)
            max_size = 100 * 1024 * 1024  # 100MB
            file_obj.seek(0, 2)  # Seek to end
            size = file_obj.tell()
            file_obj.seek(0)  # Reset
            
            if size > max_size:
                return {
                    'success': False,
                    'error': f'File too large. Maximum size is {max_size / (1024*1024):.0f}MB'
                }
            
            # Upload to Drive
            result = self.drive_client.upload_file(
                file_stream=file_obj.stream,
                filename=safe_name,
                mime_type=mime_type,
                folder_id=folder_id
            )
            
            logger.info(f"File uploaded: {result['id']}")
            
            return {
                'success': True,
                'message': f'File "{safe_name}" uploaded successfully',
                'document': result
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error uploading file: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error uploading file: {e}")
            raise DocsServiceError(f"Failed to upload file: {str(e)}")
    
    def _sanitize_filename(self, filename):
        """
        Sanitize filename to remove dangerous characters
        """
        import re
        # Remove path separators and null bytes
        filename = filename.replace('/', '_').replace('\\', '_').replace('\0', '')
        # Remove or replace other potentially dangerous characters
        filename = re.sub(r'[<>:"|?*]', '_', filename)
        # Limit length
        max_length = 255
        if len(filename) > max_length:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:max_length - len(ext) - 1] + '.' + ext if ext else name[:max_length]
        
        return filename.strip()
    
    # ===== DOCUMENT RETRIEVAL =====
    
    def get_document(self, file_id):
        """
        Get document details
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            Dictionary with document details
        """
        try:
            file_data = self.drive_client.get_file_metadata(file_id)
            enriched = self._enrich_document(file_data)
            
            return {
                'success': True,
                'document': enriched
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error getting document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error getting document: {e}")
            raise DocsServiceError(f"Failed to get document: {str(e)}")
    
    def download_document(self, file_id):
        """
        Download document content
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            Dictionary with file content and metadata
        """
        try:
            # Get metadata first
            metadata = self.drive_client.get_file_metadata(file_id)
            
            # Download content
            content = self.drive_client.download_file(file_id)
            
            return {
                'success': True,
                'content': content,
                'metadata': metadata
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error downloading document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error downloading document: {e}")
            raise DocsServiceError(f"Failed to download document: {str(e)}")
    
    # ===== DOCUMENT MANAGEMENT =====
    
    def delete_document(self, file_id):
        """
        Delete a document
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            Dictionary with deletion result
        """
        try:
            # Get document name before deletion for response message
            try:
                metadata = self.drive_client.get_file_metadata(file_id)
                doc_name = metadata.get('name', 'Document')
            except:
                doc_name = 'Document'
            
            # Delete from Drive
            self.drive_client.delete_file(file_id)
            
            logger.info(f"Document deleted: {file_id}")
            
            return {
                'success': True,
                'message': f'"{doc_name}" deleted successfully'
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error deleting document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error deleting document: {e}")
            raise DocsServiceError(f"Failed to delete document: {str(e)}")
    
    def rename_document(self, file_id, new_name):
        """
        Rename a document
        
        Args:
            file_id: Google Drive file ID
            new_name: New document name
        
        Returns:
            Dictionary with rename result
        """
        try:
            if not new_name or not new_name.strip():
                return {
                    'success': False,
                    'error': 'New name is required'
                }
            
            # Sanitize new name
            safe_name = self._sanitize_filename(new_name)
            
            # Rename in Drive
            result = self.drive_client.rename_file(file_id, safe_name)
            
            logger.info(f"Document renamed: {file_id} -> {safe_name}")
            
            return {
                'success': True,
                'message': f'Document renamed to "{safe_name}"',
                'document': result
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error renaming document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error renaming document: {e}")
            raise DocsServiceError(f"Failed to rename document: {str(e)}")
    
    # ===== FOLDER MANAGEMENT =====
    
    def create_folder(self, folder_name, parent_folder_id=None):
        """
        Create a new folder
        
        Args:
            folder_name: Name of the folder
            parent_folder_id: Optional parent folder ID
        
        Returns:
            Dictionary with folder creation result
        """
        try:
            if not folder_name or not folder_name.strip():
                return {
                    'success': False,
                    'error': 'Folder name is required'
                }
            
            safe_name = self._sanitize_filename(folder_name)
            
            result = self.drive_client.create_folder(safe_name, parent_folder_id)
            
            logger.info(f"Folder created: {result['id']}")
            
            return {
                'success': True,
                'message': f'Folder "{safe_name}" created successfully',
                'folder': result
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error creating folder: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating folder: {e}")
            raise DocsServiceError(f"Failed to create folder: {str(e)}")
    
    # ===== SHARING =====
    
    def share_document(self, file_id, email, permission='reader'):
        """
        Share document with a user
        
        Args:
            file_id: Google Drive file ID
            email: Email address to share with
            permission: Permission level ('reader', 'writer', 'commenter')
        
        Returns:
            Dictionary with sharing result
        """
        try:
            # Validate email (basic validation)
            import re
            if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
                return {
                    'success': False,
                    'error': 'Invalid email address'
                }
            
            # Validate permission level
            valid_permissions = ['reader', 'writer', 'commenter']
            if permission not in valid_permissions:
                return {
                    'success': False,
                    'error': f'Permission must be one of: {", ".join(valid_permissions)}'
                }
            
            permission_id = self.drive_client.share_file(file_id, email, permission)
            
            logger.info(f"Document shared: {file_id} with {email}")
            
            return {
                'success': True,
                'message': f'Document shared with {email} as {permission}',
                'permission_id': permission_id
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error sharing document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error sharing document: {e}")
            raise DocsServiceError(f"Failed to share document: {str(e)}")
    
    def make_document_public(self, file_id):
        """
        Make document publicly accessible
        
        Args:
            file_id: Google Drive file ID
        
        Returns:
            Dictionary with public link
        """
        try:
            result = self.drive_client.make_public(file_id)
            
            logger.info(f"Document made public: {file_id}")
            
            return {
                'success': True,
                'message': 'Document is now publicly accessible',
                'links': result
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error making document public: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error making document public: {e}")
            raise DocsServiceError(f"Failed to make document public: {str(e)}")
    
    # ===== SEARCH =====
    
    def search_documents(self, query, limit=20):
        """
        Search for documents
        
        Args:
            query: Search query string
            limit: Maximum number of results
        
        Returns:
            Dictionary with search results
        """
        try:
            if not query or not query.strip():
                return {
                    'success': False,
                    'error': 'Search query is required'
                }
            
            files = self.drive_client.search_files(query.strip(), limit)
            enriched_files = [self._enrich_document(file) for file in files]
            
            return {
                'success': True,
                'count': len(enriched_files),
                'query': query,
                'documents': enriched_files
            }
            
        except DriveClientError as e:
            logger.error(f"Drive error searching documents: {e}")
            return {
                'success': False,
                'error': str(e),
                'documents': []
            }
        except Exception as e:
            logger.error(f"Unexpected error searching documents: {e}")
            raise DocsServiceError(f"Failed to search documents: {str(e)}")
    
    # ===== HELPER METHODS =====
    
    def get_storage_info(self):
        """
        Get storage usage information (if available)
        This is a placeholder - implement based on your needs
        """
        return {
            'success': True,
            'message': 'Storage info not yet implemented'
        }