import urllib.request
import urllib.error
import json

payload = {
    "primer_nombre": "Andres",
    "primer_apellido": "Gonza",
    "documento_identidad": "23161156132",
    "categoria": "AE",
    "estado": "ACTIVO",
}

def post_data(data):
    req = urllib.request.Request("http://localhost:8001/api/v1/medicos/", data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
    try:
        r = urllib.request.urlopen(req)
        print(r.status, r.read().decode())
    except urllib.error.HTTPError as e:
        print(e.code, e.read().decode())
    except Exception as e:
        print(e)

print("POST with correct FK:")
post_data(payload)

payload.pop("categoria")
payload["documento_identidad"] = "23161156133"
print("\nPOST without category:")
post_data(payload)

payload["documento_identidad"] = "23161156134"
payload["categoria"] = "AE - Especialista"
print("\nPOST with bad FK:")
post_data(payload)


