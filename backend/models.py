from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='pendente')
    priority = db.Column(db.String(20), default='Média')
    category = db.Column(db.String(50), default='Pessoal')
    due_date = db.Column(db.String(20)) # Nova: Data de entrega
    tags = db.Column(db.String(100))     # Nova: Tags separadas por vírgula
    created_at = db.Column(db.String(10))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'status': self.status,
            'priority': self.priority,
            'category': self.category,
            'due_date': self.due_date,
            'tags': self.tags,
            'created_at': self.created_at
        }