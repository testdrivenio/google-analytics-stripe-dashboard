from project import db


class Charge(db.Model):
    __tablename__ = "charges"

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Integer, nullable=False)
    created = db.Column(db.DateTime, nullable=False)

    def __init__(self, amount, created):
        self.amount = amount
        self.created = created

    def __repr__(self):
        return f"{self.created}"
