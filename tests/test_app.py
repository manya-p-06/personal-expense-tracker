
import sys
import os

sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
)

import database
import app as application


def setup_function():
    database.DATABASE = os.path.join(
        os.path.dirname(__file__), "test_expenses.db"
    )
    database.initialize_database()


def teardown_function():
    if os.path.exists(database.DATABASE):
        os.remove(database.DATABASE)


def test_home():
    client = application.app.test_client()
    response = client.get("/")
    assert response.status_code == 200


def test_health():
    client = application.app.test_client()
    response = client.get("/api/health")
    assert response.status_code == 200


def test_add_transaction():
    client = application.app.test_client()

    response = client.post("/api/transactions", json={
        "title": "Salary",
        "amount": 25000,
        "category": "Work",
        "transaction_type": "income",
        "transaction_date": "2026-11-22"
    })

    assert response.status_code == 201


def test_summary():
    client = application.app.test_client()

    client.post("/api/transactions", json={
        "title": "Salary",
        "amount": 25000,
        "category": "Work",
        "transaction_type": "income",
        "transaction_date": "2026-11-22"
    })

    response = client.get("/api/summary")
    data = response.get_json()

    assert data["total_income"] == 25000
    assert data["total_expenses"] == 0
    assert data["balance"] == 25000


def test_invalid_transaction():
    client = application.app.test_client()

    response = client.post("/api/transactions", json={
        "title": "Food",
        "amount": -100,
        "category": "Food",
        "transaction_type": "expense"
    })

    assert response.status_code == 400


def test_delete_transaction():
    client = application.app.test_client()

    add_response = client.post("/api/transactions", json={
        "title": "Shopping",
        "amount": 500,
        "category": "Personal",
        "transaction_type": "expense",
        "transaction_date": "2026-11-22"
    })

    transaction_id = add_response.get_json()["id"]

    delete_response = client.delete(
        f"/api/transactions/{transaction_id}"
    )

    assert delete_response.status_code == 200

    response = client.get("/api/transactions")
    assert response.get_json() == []


def test_invalid_transaction_type():
    client = application.app.test_client()

    response = client.post("/api/transactions", json={
        "title": "Shopping",
        "amount": 500,
        "category": "Personal",
        "transaction_type": "unknown",
        "transaction_date": "2026-11-22"
    })

    assert response.status_code == 400


def test_invalid_date():
    client = application.app.test_client()

    response = client.post("/api/transactions", json={
        "title": "Shopping",
        "amount": 500,
        "category": "Personal",
        "transaction_type": "expense",
        "transaction_date": "invalid-date"
    })

    assert response.status_code == 400


def test_missing_transaction_fields():
    client = application.app.test_client()

    response = client.post("/api/transactions", json={
        "title": "Shopping",
        "amount": 500
    })

    assert response.status_code == 400
