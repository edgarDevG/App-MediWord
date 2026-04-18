from database import engine, Base, SessionLocal
from model import User
from routers.auth import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()
admin = db.query(User).filter_by(username="admin").first()
if not admin:
    admin = User(
        username="admin",
        hashed_password=get_password_hash("admin123"),
        rol="admin"
    )
    db.add(admin)
    db.commit()
    print("Usuario admin creado exitosamente. Password: admin123")
else:
    print("El usuario admin ya existe.")
db.close()
