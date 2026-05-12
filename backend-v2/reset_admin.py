from database import SessionLocal
from model import User
from routers.auth import get_password_hash

db = SessionLocal()
admin = db.query(User).filter_by(username="admin").first()
if admin:
    admin.hashed_password = get_password_hash("admin123")
    admin.activo = True
    admin.rol = "admin"
    db.commit()
    print("Contraseña del admin restablecida a: admin123")
else:
    admin = User(username="admin", hashed_password=get_password_hash("admin123"), rol="admin")
    db.add(admin)
    db.commit()
    print("Usuario admin creado con contraseña: admin123")
db.close()
