# controllers/docs_controller.py
from flask import Blueprint, render_template, request, jsonify, send_file, flash, redirect, url_for
from services.docs_service import DocsService, DocsServiceError
from werkzeug.utils import secure_filename
import io
import logging

logger = logging.getLogger(__name__)

# Create blueprint
docs_bp = Blueprint('docs', __name__, url_prefix='/docs')


# ===== PAGE ROUTES =====

@docs_bp.route('/')
def docs_page():
    """Render the documentation page"""
    try:
        return render_template('docs.html')
    except Exception as e:
        logger.error(f"Error loading docs page: {e}")
        return f"Error loading documentation page: {str(e)}", 500


# ===== API ENDPOINTS =====

@docs_bp.route('/api/documents', methods=['GET'])
def list_documents():
    """
    Get list of documents
    Query params:
        - limit: number of documents (default: 50)
        - sort_by: recent|name|size (default: recent)
        - type: filter by file type
        - folder_id: filter by folder (optional)
    """
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        sort_by = request.args.get('sort_by', 'recent')
        file_type = request.args.get('type')
        folder_id = request.args.get('folder_id')
        
        # Validate limit
        if limit < 1 or limit > 100:
            return jsonify({
                'success': False,
                'error': 'Limit must be between 1 and 100'
            }), 400
        
        # Get documents from service
        service = DocsService()
        result = service.list_documents(
            limit=limit,
            sort_by=sort_by,
            file_type=file_type,
            folder_id=folder_id
        )
        
        return jsonify(result), 200 if result['success'] else 500
        
    except DocsServiceError as e:
        logger.error(f"Service error listing documents: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error listing documents: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@docs_bp.route('/api/documents/<file_id>', methods=['GET'])
def get_document(file_id):
    """Get document details by ID"""
    try:
        if not file_id:
            return jsonify({
                'success': False,
                'error': 'File ID is required'
            }), 400
        
        service = DocsService()
        result = service.get_document(file_id)
        
        return jsonify(result), 200 if result['success'] else 404
        
    except DocsServiceError as e:
        logger.error(f"Service error getting document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error getting document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/documents', methods=['POST'])
def create_document():
    """
    Create a new text document
    JSON body:
        - title: document title (required)
        - content: document content (optional)
        - folder_id: parent folder ID (optional)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        title = data.get('title')
        content = data.get('content', '')
        folder_id = data.get('folder_id')
        
        if not title:
            return jsonify({
                'success': False,
                'error': 'Title is required'
            }), 400
        
        service = DocsService()
        result = service.upload_document(
            title=title,
            content=content,
            folder_id=folder_id
        )
        
        return jsonify(result), 201 if result['success'] else 400
        
    except DocsServiceError as e:
        logger.error(f"Service error creating document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error creating document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/documents/upload', methods=['POST'])
def upload_file():
    """
    Upload a file
    Form data:
        - file: file to upload (required)
        - folder_id: parent folder ID (optional)
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if filename is empty
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Get optional folder ID
        folder_id = request.form.get('folder_id')
        
        # Upload file
        service = DocsService()
        result = service.upload_file(
            file_obj=file,
            folder_id=folder_id
        )
        
        return jsonify(result), 201 if result['success'] else 400
        
    except DocsServiceError as e:
        logger.error(f"Service error uploading file: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error uploading file: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/documents/<file_id>/download', methods=['GET'])
def download_document(file_id):
    """Download a document"""
    try:
        if not file_id:
            return jsonify({
                'success': False,
                'error': 'File ID is required'
            }), 400
        
        service = DocsService()
        result = service.download_document(file_id)
        
        if not result['success']:
            return jsonify(result), 404
        
        # Send file
        return send_file(
            io.BytesIO(result['content']),
            as_attachment=True,
            download_name=result['metadata']['name'],
            mimetype=result['metadata'].get('mime_type', 'application/octet-stream')
        )
        
    except DocsServiceError as e:
        logger.error(f"Service error downloading document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error downloading document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/documents/<file_id>', methods=['PUT'])
def update_document(file_id):
    """
    Update document (rename)
    JSON body:
        - name: new document name (required)
    """
    try:
        if not file_id:
            return jsonify({
                'success': False,
                'error': 'File ID is required'
            }), 400
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        new_name = data.get('name')
        if not new_name:
            return jsonify({
                'success': False,
                'error': 'New name is required'
            }), 400
        
        service = DocsService()
        result = service.rename_document(file_id, new_name)
        
        return jsonify(result), 200 if result['success'] else 400
        
    except DocsServiceError as e:
        logger.error(f"Service error updating document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error updating document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/documents/<file_id>', methods=['DELETE'])
def delete_document(file_id):
    """Delete a document"""
    try:
        if not file_id:
            return jsonify({
                'success': False,
                'error': 'File ID is required'
            }), 400
        
        service = DocsService()
        result = service.delete_document(file_id)
        
        return jsonify(result), 200 if result['success'] else 404
        
    except DocsServiceError as e:
        logger.error(f"Service error deleting document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error deleting document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/folders', methods=['POST'])
def create_folder():
    """
    Create a new folder
    JSON body:
        - name: folder name (required)
        - parent_id: parent folder ID (optional)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        name = data.get('name')
        if not name:
            return jsonify({
                'success': False,
                'error': 'Folder name is required'
            }), 400
        
        parent_id = data.get('parent_id')
        
        service = DocsService()
        result = service.create_folder(name, parent_id)
        
        return jsonify(result), 201 if result['success'] else 400
        
    except DocsServiceError as e:
        logger.error(f"Service error creating folder: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error creating folder: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/documents/<file_id>/share', methods=['POST'])
def share_document(file_id):
    """
    Share document with a user
    JSON body:
        - email: email address (required)
        - permission: reader|writer|commenter (default: reader)
    """
    try:
        if not file_id:
            return jsonify({
                'success': False,
                'error': 'File ID is required'
            }), 400
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        email = data.get('email')
        if not email:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        permission = data.get('permission', 'reader')
        
        service = DocsService()
        result = service.share_document(file_id, email, permission)
        
        return jsonify(result), 200 if result['success'] else 400
        
    except DocsServiceError as e:
        logger.error(f"Service error sharing document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error sharing document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/documents/<file_id>/public', methods=['POST'])
def make_document_public(file_id):
    """Make document publicly accessible"""
    try:
        if not file_id:
            return jsonify({
                'success': False,
                'error': 'File ID is required'
            }), 400
        
        service = DocsService()
        result = service.make_document_public(file_id)
        
        return jsonify(result), 200 if result['success'] else 400
        
    except DocsServiceError as e:
        logger.error(f"Service error making document public: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error making document public: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@docs_bp.route('/api/documents/search', methods=['GET'])
def search_documents():
    """
    Search for documents
    Query params:
        - q: search query (required)
        - limit: max results (default: 20)
    """
    try:
        query = request.args.get('q')
        if not query:
            return jsonify({
                'success': False,
                'error': 'Search query is required'
            }), 400
        
        limit = request.args.get('limit', 20, type=int)
        
        service = DocsService()
        result = service.search_documents(query, limit)
        
        return jsonify(result), 200
        
    except DocsServiceError as e:
        logger.error(f"Service error searching documents: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'documents': []
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error searching documents: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'documents': []
        }), 500


# ===== ERROR HANDLERS =====

@docs_bp.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors"""
    return jsonify({
        'success': False,
        'error': 'File too large. Maximum upload size exceeded.'
    }), 413


@docs_bp.errorhandler(500)
def internal_server_error(error):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'success': False,
        'error': 'An internal server error occurred'
    }), 500