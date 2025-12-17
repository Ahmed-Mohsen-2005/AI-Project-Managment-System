from flask import Blueprint, jsonify, request, abort
from models.note import Note
from services.note_service import NoteService

note_bp = Blueprint("note", __name__, url_prefix="/api/v1/notes")

note_service = NoteService()


# ====================================
# Get all notes
# ====================================
@note_bp.route("", methods=["GET"])
@note_bp.route("/", methods=["GET"])
def list_all_notes():
    notes = note_service.get_all_notes()
    return jsonify([n.to_dict() for n in notes]), 200


# ====================================
# Get notes by entity (task / project / sprint)
# ====================================
@note_bp.route("/<string:entity_type>/<int:entity_id>", methods=["GET"])
def get_notes_by_entity(entity_type, entity_id):
    try:
        notes = note_service.get_notes_by_entity(entity_type, entity_id)
        return jsonify([n.to_dict() for n in notes]), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


# ====================================
# Create new note
# ====================================
@note_bp.route("", methods=["POST"])
@note_bp.route("/", methods=["POST"])
def create_note():
    try:
        if not request.is_json:
            return jsonify({"error": "JSON body required"}), 400

        data = request.json
        print(f"[DEBUG] Received note data: {data}")

        # Validate required fields
        if not data.get("content"):
            return jsonify({"error": "Note content is required"}), 400
        if not data.get("entity_type"):
            return jsonify({"error": "entity_type is required"}), 400
        if not data.get("entity_id"):
            return jsonify({"error": "entity_id is required"}), 400

        # Default created_by
        if "created_by" not in data:
            data["created_by"] = 1  # fallback (replace with session later)

        try:
            note = Note(**data)
            print("[DEBUG] Note object created successfully")
        except ValueError as e:
            return jsonify({"error": f"Invalid data: {str(e)}"}), 400

        try:
            note_id = note_service.create_note(note)
            return jsonify(
                {"note_id": note_id, "message": "Note created successfully"}
            ), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


# ====================================
# Update note content
# ====================================
@note_bp.route("/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    if not request.is_json:
        return jsonify({"error": "JSON body required"}), 400

    data = request.json

    if not data.get("content"):
        return jsonify({"error": "Note content is required"}), 400

    try:
        note_service.update_note_content(note_id, data["content"])
        return jsonify({"message": "Note updated successfully"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


# ====================================
# Delete note
# ====================================
@note_bp.route("/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    try:
        note_service.delete_note(note_id)
        return jsonify({"message": "Note deleted successfully"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
