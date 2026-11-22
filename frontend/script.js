
const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

let allTransactions = [];
let currentFilter = "all";

const categoryColors = [
    "#7657e8",
    "#16b887",
    "#f16b75",
    "#5287ed",
    "#f2a541",
    "#22b8cf"
];

function money(value) {
    return currency.format(Number(value) || 0);
}

function localDateString() {
    const now = new Date();
    const local = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    );
    return local.toISOString().slice(0, 10);
}

function showDate() {
    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}

function showMessage(message, type) {
    const element = document.getElementById("formMessage");
    element.textContent = message;
    element.className = "form-message " + type;
}

// LOAD DASHBOARD SUMMARY

async function loadSummary() {
    const response = await fetch("/api/summary");

    if (!response.ok) {
        throw new Error("Unable to load summary");
    }

    const data = await response.json();

    document.getElementById("income").textContent =
        money(data.total_income);

    document.getElementById("expenses").textContent =
        money(data.total_expenses);

    document.getElementById("balance").textContent =
        money(data.balance);

    document.getElementById("incomeLegend").textContent =
        money(data.total_income);

    document.getElementById("expenseLegend").textContent =
        money(data.total_expenses);

    document.getElementById("totalActivity").textContent =
        money(Number(data.total_income) + Number(data.total_expenses));

    updateDonut(data.total_income, data.total_expenses);
}

// DOUGHNUT CHART

function updateDonut(income, expenses) {
    const chart = document.getElementById("moneyDonut");

    income = Number(income) || 0;
    expenses = Number(expenses) || 0;

    const total = income + expenses;

    if (total === 0) {
        chart.style.background =
            "conic-gradient(#e9eaf1 0% 100%)";
        return;
    }

    const incomePercentage = (income / total) * 100;

    chart.style.background =
        `conic-gradient(
            #16b887 0% ${incomePercentage}%,
            #f16b75 ${incomePercentage}% 100%
        )`;
}

// LOAD TRANSACTIONS

async function loadTransactions() {
    const response = await fetch("/api/transactions");

    if (!response.ok) {
        throw new Error("Unable to load transactions");
    }

    allTransactions = await response.json();

    renderTransactions();
    updateMonthlyChart();
    updateCategories();
}

// TRANSACTION HISTORY

function renderTransactions() {
    const container = document.getElementById("transactions");

    container.innerHTML = "";

    const search = document
        .getElementById("searchTransaction")
        .value.toLowerCase()
        .trim();

    const filtered = allTransactions.filter(item => {
        const matchesFilter =
            currentFilter === "all" ||
            item.transaction_type === currentFilter;

        const matchesSearch =
            String(item.title).toLowerCase().includes(search) ||
            String(item.category).toLowerCase().includes(search);

        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML =
            '<p class="empty-message">No matching transactions found.</p>';
        return;
    }

    filtered.forEach(item => {
        const isIncome = item.transaction_type === "income";

        const div = document.createElement("div");
        div.className = "transaction";

        const left = document.createElement("div");
        left.className = "transaction-left";

        const icon = document.createElement("div");
        icon.className =
            "transaction-icon " + (isIncome ? "income" : "expense");
        icon.textContent = isIncome ? "💰" : "🛍️";

        const details = document.createElement("div");
        details.className = "transaction-details";

        const title = document.createElement("h4");
        title.textContent = item.title;

        const description = document.createElement("p");
        description.textContent =
            `${item.category} • ${item.transaction_date}`;

        details.append(title, description);
        left.append(icon, details);

        const right = document.createElement("div");
        right.className = "transaction-right";

        const amount = document.createElement("span");
        amount.className =
            "transaction-amount " + (isIncome ? "income" : "expense");

        amount.textContent =
            (isIncome ? "+ " : "- ") + money(item.amount);

        const button = document.createElement("button");
        button.className = "delete-button";
        button.textContent = "Delete";

        button.addEventListener("click", async () => {
            const confirmed = confirm(
                "Are you sure you want to delete this transaction?"
            );

            if (!confirmed) return;

            try {
                const response = await fetch(
                    `/api/transactions/${item.id}`,
                    { method: "DELETE" }
                );

                if (!response.ok) {
                    throw new Error("Could not delete transaction");
                }

                await refreshData();
            } catch (error) {
                alert(error.message);
            }
        });

        right.append(amount, button);
        div.append(left, right);

        container.appendChild(div);
    });
}

// MONTHLY EXPENSE BAR CHART

function updateMonthlyChart() {
    const container = document.getElementById("monthlyChart");
    container.innerHTML = "";

    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
        );

        const key =
            date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0");

        months.push({
            key,
            label: date.toLocaleDateString("en-IN", {
                month: "short"
            }),
            total: 0
        });
    }

    allTransactions.forEach(item => {
        if (item.transaction_type !== "expense") return;

        const monthKey = String(item.transaction_date).slice(0, 7);

        const month = months.find(m => m.key === monthKey);

        if (month) {
            month.total += Number(item.amount);
        }
    });

    const maximum = Math.max(
        ...months.map(m => m.total),
        1
    );

    months.forEach(month => {
        const column = document.createElement("div");
        column.className = "month-column";

        const value = document.createElement("span");
        value.className = "bar-value";
        value.textContent =
            month.total === 0 ? "₹0" : money(month.total);

        const track = document.createElement("div");
        track.className = "bar-track";

        const bar = document.createElement("div");
        bar.className = "bar";

        const height =
            month.total === 0 ? 0 : (month.total / maximum) * 100;

        bar.style.height = height + "%";
        bar.title = `${month.label}: ${money(month.total)}`;

        const label = document.createElement("span");
        label.className = "month-label";
        label.textContent = month.label;

        track.appendChild(bar);
        column.append(value, track, label);

        container.appendChild(column);
    });
}

// CATEGORY-WISE EXPENSE BREAKDOWN

function updateCategories() {
    const container = document.getElementById("categoryBreakdown");
    container.innerHTML = "";

    const totals = {};

    allTransactions.forEach(item => {
        if (item.transaction_type !== "expense") return;

        const category = String(item.category).trim() || "Other";

        totals[category] =
            (totals[category] || 0) + Number(item.amount);
    });

    const categories = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    if (categories.length === 0) {
        container.innerHTML =
            '<p class="empty-message">No expense categories yet.</p>';
        return;
    }

    const grandTotal = categories.reduce(
        (sum, item) => sum + item[1], 0
    );

    categories.slice(0, 6).forEach(([name, amount], index) => {
        const percentage =
            grandTotal > 0 ? (amount / grandTotal) * 100 : 0;

        const item = document.createElement("div");
        item.className = "category-item";

        const info = document.createElement("div");
        info.className = "category-info";

        const categoryName = document.createElement("span");
        categoryName.textContent =
            name + " (" + percentage.toFixed(1) + "%)";

        const value = document.createElement("strong");
        value.textContent = money(amount);

        info.append(categoryName, value);

        const track = document.createElement("div");
        track.className = "category-track";

        const fill = document.createElement("div");
        fill.className = "category-fill";
        fill.style.width = percentage + "%";
        fill.style.background =
            categoryColors[index % categoryColors.length];

        track.appendChild(fill);
        item.append(info, track);

        container.appendChild(item);
    });
}

// REFRESH EVERYTHING

async function refreshData() {
    await Promise.all([
        loadSummary(),
        loadTransactions()
    ]);
}

// ADD TRANSACTION

document.getElementById("transactionForm").addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        const button = document.getElementById("addButton");

        const transaction = {
            title: document.getElementById("title").value.trim(),
            amount: document.getElementById("amount").value,
            category: document.getElementById("category").value.trim(),
            transaction_type: document.getElementById("type").value,
            transaction_date:
                document.getElementById("transactionDate").value
        };

        button.disabled = true;
        button.textContent = "Adding...";

        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(transaction)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Unable to add transaction"
                );
            }

            this.reset();

            document.getElementById("transactionDate").value =
                localDateString();

            document.getElementById("type").value = "income";

            showMessage("Transaction added successfully! ✓", "success");

            await refreshData();

        } catch (error) {
            showMessage(error.message, "error");
        } finally {
            button.disabled = false;
            button.textContent = "+ Add Transaction";
        }
    }
);

// SEARCH TRANSACTIONS

document.getElementById("searchTransaction").addEventListener(
    "input",
    renderTransactions
);

// FILTER BUTTONS

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        renderTransactions();
    });
});

// START DASHBOARD

async function startDashboard() {
    showDate();

    document.getElementById("transactionDate").value =
        localDateString();

    try {
        await refreshData();
    } catch (error) {
        document.getElementById("transactions").innerHTML =
            '<p class="empty-message">Unable to connect to the server. Please restart the application.</p>';

        console.error(error);
    }
}

startDashboard();
