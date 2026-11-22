
from flask import Flask, request, jsonify, send_from_directory
from database import get_connection, initialize_database
from datetime import date
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

initialize_database()


@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/style.css")
def styles():
    return send_from_directory(FRONTEND_DIR, "style.css")


@app.route("/script.js")
def scripts():
    return send_from_directory(FRONTEND_DIR, "script.js")

@app.route("/api/health")
def health():
    return jsonify({
        "status": "success",
        "message": "Expense Tracker Backend is running!"
    })


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    connection = get_connection()

    rows = connection.execute(
        "SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC"
    ).fetchall()

    connection.close()

    return jsonify([dict(row) for row in rows])


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json(silent=True) or {}

    title = data.get("title")
    amount = data.get("amount")
    category = data.get("category")
    transaction_type = data.get("transaction_type")
    transaction_date = data.get("transaction_date") or date.today().isoformat()

    if not all([title, category, amount, transaction_type]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        amount = float(amount)
    except (ValueError, TypeError):
        return jsonify({"error": "Amount must be a number"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    if transaction_type not in ["income", "expense"]:
        return jsonify({"error": "Invalid transaction type"}), 400

    try:
        date.fromisoformat(transaction_date)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid date"}), 400

    connection = get_connection()

    cursor = connection.execute("""
        INSERT INTO transactions
        (title, amount, category, transaction_type, transaction_date)
        VALUES (?, ?, ?, ?, ?)
    """, (
        str(title).strip(),
        amount,
        str(category).strip(),
        transaction_type,
        transaction_date
    ))

    connection.commit()
    transaction_id = cursor.lastrowid
    connection.close()

    return jsonify({
        "message": "Transaction added successfully",
        "id": transaction_id
    }), 201


@app.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    connection = get_connection()

    cursor = connection.execute(
        "DELETE FROM transactions WHERE id = ?",
        (transaction_id,)
    )

    connection.commit()
    deleted = cursor.rowcount
    connection.close()

    if deleted == 0:
        return jsonify({"error": "Transaction not found"}), 404

    return jsonify({"message": "Transaction deleted successfully"})


@app.route("/api/summary")
def summary():
    connection = get_connection()

    income = connection.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE transaction_type = 'income'
    """).fetchone()[0]

    expenses = connection.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE transaction_type = 'expense'
    """).fetchone()[0]

    connection.close()

    return jsonify({
        "total_income": income,
        "total_expenses": expenses,
        "balance": income - expenses
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
