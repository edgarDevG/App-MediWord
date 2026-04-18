from database import SessionLocal
from model import User
from routers.auth import verify_password

db = SessionLocal()
user = db.query(User).filter_by(username='Edgar').first()
print('User found:', user is not None)
if user:
    print('Password valid:', verify_password("Edgar123", user.hashed_password))
db.close()
