from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Task
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuração do Banco de Dados
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Cria o banco de dados se ele não existir
with app.app_context():
    db.create_all()


# ROTA: Listar todas as tarefas
@app.route('/tasks', methods=['GET'])
def get_tasks():
    # Ordena pelas mais recentes primeiro
    tasks = Task.query.order_by(Task.id.desc()).all()
    return jsonify([task.to_dict() for task in tasks])


# ROTA: Criar nova tarefa
@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.get_json()

    # Pegamos os dados enviados pelo React ou usamos valores padrão
    new_task = Task(
        title=data.get('title'),
        priority=data.get('priority', 'Média'),
        category=data.get('category', 'Pessoal'),
        due_date=data.get('due_date', ''),  # Captura a data escolhida no calendário
        created_at=datetime.now().strftime("%H:%M")  # Hora atual
    )

    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201


# ROTA: Alternar Status ou Deletar Única
@app.route('/tasks/<int:id>', methods=['PUT', 'DELETE'])
def handle_task(id):
    task = Task.query.get_or_404(id)

    if request.method == 'PUT':
        # Alterna entre pendente e concluída
        task.status = 'concluída' if task.status == 'pendente' else 'pendente'
        db.session.commit()
        return jsonify(task.to_dict())

    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Deletado com sucesso'})


# ROTA: Editar apenas o Título
@app.route('/tasks/<int:id>/edit', methods=['PUT'])
def edit_task(id):
    task = Task.query.get_or_404(id)
    data = request.get_json()

    if 'title' in data:
        task.title = data['title']
        db.session.commit()

    return jsonify(task.to_dict())


# ROTA: Limpar todas as tarefas concluídas
@app.route('/tasks/clear-completed', methods=['DELETE'])
def clear_completed():
    try:
        # Deleta todas onde o status é 'concluída'
        Task.query.filter_by(status='concluída').delete()
        db.session.commit()
        return jsonify({'message': 'Limpeza concluída'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)