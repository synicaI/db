from fastapi import FastAPI
from datetime import datetime
import uvicorn

app = FastAPI()

# Format de la DB : "CLE": ["HWID", "DATE_EXPIRATION (JJ/MM/AAAA)"]
database = {
    "CLE-TEST-2027": ["NONE", "01/04/2027"],
    "CLE-EXPIREE": ["NONE", "01/01/2020"]
}

@app.get("/verify")
def verify(key: str, hwid: str):
    # 1. Vérifier si la clé existe
    if key not in database:
        return "INVALID_KEY"

    data = database[key]
    hwid_stocke = data[0]
    date_exp_str = data[1]

    # 2. Vérifier la date d'expiration
    try:
        date_expiration = datetime.strptime(date_exp_str, "%d/%m/%Y")
        if datetime.now() > date_expiration:
            return "KEY_EXPIRED"
    except ValueError:
        return "DATE_ERROR"

    # 3. Vérifier ou lier le HWID
    if hwid_stocke == "NONE":
        database[key][0] = hwid  # On lie le PC à la clé
        return "OK"
    elif hwid_stocke == hwid:
        return "OK"
    else:
        return "HWID_MISMATCH"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
