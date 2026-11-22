
async function loadSummary() {
    const response = await fetch("/api/summary");
    const data = await response.json();

    document.getElementById("income").textContent =
        "₹" + Number(data.total_income).toFixed(2);

    document.getElementById("expenses").textContent =
        "₹" + Number(data.total_expenses).toFixed(2);

    document.getElementById("balance").textContent =
        "₹" + Number(data.balance).toFixed(2);
}

async function loadTransactions() {
    const response = await fetch("/api/transactions");
    const data = await response.json();

    const container = document.getElementById("transactions");
    container.innerHTML = "";

    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "transaction";

        const details = document.createElement("span");
        details.textContent =
            `${item.title} | ${item.category} | ${item.transaction_date} | ${item.transaction_type} | ₹${Number(item.amount).toFixed(2)}`;

        const button = document.createElement("button");
        button.textContent = "Delete";

        button.addEventListener("click", async () => {
            await fetch(`/api/transactions/${item.id}`, {
                method: "DELETE"
            });

            refreshData();
        });

        div.append(details, button);
        container.appendChild(div);
    });
}

async function refreshData() {
    await loadSummary();
    await loadTransactions();
}

document.getElementById("transactionDate").value =
    new Date().toISOString().slice(0, 10);

document.getElementById("transactionForm").addEventListener(
    "submit", async function(event) {
        event.preventDefault();

        const transaction = {
            title: document.getElementById("title").value,
            amount: document.getElementById("amount").value,
            category: document.getElementById("category").value,
            transaction_type: document.getElementById("type").value,
            transaction_date: document.getElementById("transactionDate").value
        };

        const response = await fetch("/api/transactions", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(transaction)
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || "Unable to add transaction");
            return;
        }

        this.reset();
        document.getElementById("transactionDate").value =
            new Date().toISOString().slice(0, 10);

        await refreshData();
        alert("Transaction added successfully!");
    }
);

refreshData();
