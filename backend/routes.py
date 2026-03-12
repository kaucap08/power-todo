from flask import request, jsonify
from models import db, Task

def register_routes(app):
    @app.route('/tasks', methods=['GET'])
    def get_tasks():
        tasks = Task.query.all()
        return jsonify([t.to_dict() for t in tasks])

    @app.route('/tasks', methods=['POST'])
    def add_task():
        data = request.json
        new_task = Task(title=data.get('title'))
        db.session.add(new_task)
        db.session.commit()
        return jsonify(new_task.to_dict()), 201

    # ROTA: Atualizar status da tarefa (Marcar como concluída)
    @app.route('/tasks/<int:id>', methods=['PUT'])
    def update_task(id):
        task = Task.query.get(id)
        if not task:
            return jsonify({"error": "Tarefa não encontrada"}), 404

        # Inverte o status: se era pendente, vira concluída
        task.status = "concluída" if task.status == "pendente" else "pendente"
        db.session.commit()
        return jsonify(task.to_dict())

    # ROTA: Deletar tarefa (Você já deve ter, mas confira se está assim)
    @app.route('/tasks/<int:id>', methods=['DELETE'])
    def delete_task(id):
        task = Task.query.get(id)
        if not task:
            return jsonify({"error": "Tarefa não encontrada"}), 404
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Tarefa deletada!"})