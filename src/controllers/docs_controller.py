from flask import Blueprint, jsonify, request, abort, render_template



docs_bp = Blueprint("docs", __name__, url_prefix="/api/v1/docs")

# docs_service = DocumentService()


@docs_bp.route("", methods=["GET"])
@docs_bp.route("/", methods=["GET"])
def list_documents():
    """
    Get all documents
    """
    # docs = docs_service.get_all_documents()
    # return jsonify([d.to_dict() for d in docs]), 200
    return jsonify([]), 200  # placeholder


@docs_bp.route("/<int:doc_id>", methods=["GET"])
def get_document(doc_id):
    """
    Get single document by ID
    """
    try:
        # doc = docs_service.get_document_by_id(doc_id)
        # return jsonify(doc.to_dict()), 200
        return jsonify({"doc_id": doc_id}), 200  # placeholder
    except ValueError:
        abort(404)


@docs_bp.route("", methods=["POST"])
@docs_bp.route("/", methods=["POST"])
def create_document():
    """
    Create a new document
    """
    if not request.is_json:
        return jsonify({"error": "JSON body required"}), 400

    data = request.json

    if not data.get("title"):
        return jsonify({"error": "Document title is required"}), 400

    try:
        # doc = Document(**data)
        # doc_id = docs_service.create_document(doc)
        # return jsonify({"doc_id": doc_id}), 201
        return jsonify({"message": "Document created"}), 201  # placeholder
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@docs_bp.route("/<int:doc_id>", methods=["PUT"])
def update_document(doc_id):
    """
    Update an existing document
    """
    if not request.is_json:
        return jsonify({"error": "JSON body required"}), 400

    data = request.json

    try:
        # existing_doc = docs_service.get_document_by_id(doc_id)
        # updated_doc = Document(doc_id=doc_id, **data)
        # docs_service.update_document(updated_doc)
        return jsonify({"message": "Document updated"}), 200
    except ValueError:
        return jsonify({"error": "Document not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@docs_bp.route("/<int:doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    """
    Delete document
    """
    try:
        # docs_service.delete_document(doc_id)
        return jsonify({"message": "Document deleted"}), 200
    except ValueError:
        return jsonify({"error": "Document not found"}), 404


@docs_bp.route("/page", methods=["GET"])
def docs_page():
    """
    Render documents page (UI)
    """
    # docs = docs_service.get_all_documents()
    return render_template("docs.html")
