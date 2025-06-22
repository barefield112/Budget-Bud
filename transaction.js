// Transaction class definition for each financial entry
class Transaction {
    constructor(income, dateStr , amount, merchant, category, description){
        this.income = income;
       // this.date = new Date(dateStr); // Converts input string to Date object
        const [year, month, day] = dateStr.split('-').map(Number);
        this.date = new Date(year, month - 1, day);
        this.amount = amount;
        this.merchant = merchant;
        this.category = category;
        this.description = description;
    }

    printTransaction(){
        // Get template and clone it to create new DOM element
        const htmlTemplate = collectTransactionItemHTMLTemplate();
        const clone = htmlTemplate.cloneNode(true);
        const dateRangeMin = dateRangeMinInput.value;
        const dateRangeMax = dateRangeMaxInput.value;
        if( new Date(dateRangeMin) <=this.date && this.date <= new Date(dateRangeMax)){ //Checks that Date is inside of date range
            // Add click listener to open edit form
            clone.addEventListener('click', ()=>{
                addTransactionPopup.classList.remove('hidden');
                const index = transactions.indexOf(this); // Get index of this transaction
                setStoredTransactionToForm(index, this.income, this.date, this.amount, this.merchant, this.category, this.description);
            });

            clone.removeAttribute('bb-transaction-item'); // Remove identifying attribute

            // Set amount text and style based on income/expense
            const amountText = clone.querySelector('[bb-transaction-item="amount"]');
            if(this.income){
                amountText.classList.add("income");
                amountText.textContent = `+$${this.amount}`;
            } else {
                amountText.classList.remove("income");
                amountText.textContent = `-$${this.amount}`;
            }

            // Set merchant, category, and date text content
            const merchantText = clone.querySelector('[bb-transaction-item="merchant"]');
            merchantText.textContent = `${this.merchant}`;
            const categoryText = clone.querySelector('[bb-transaction-item="category"]');
            categoryText.textContent = `${this.category}`;
            const dateText = clone.querySelector('[bb-transaction-item="date"]');
            dateText.textContent = `${this.formatDate()}`;

            clone.classList.remove('hidden');
        }


        container.prepend(clone); // Add to top of container
    }

    // Format date to local format
    formatDate(){
        return this.date.toLocaleDateString();
    }


}

// Main Code Initialization
const transactions = [];
const categories = [
  // Income
  'Income',

  // Savings
  'Savings',

  // Main Bills
  'Rent/Mortgage',
  'Utilities',
  'Internet',
  'Phone Bill',
  'Insurance',
  'Medical',

  // Optional Bills
     'Gas',
     'Groceries',
  'Subscriptions',
  'Childcare',
  'Pets',

  // Fun / Lifestyle
  'Dining Out',
  'Entertainment',
  'Miscellaneous',
  'Fun Money',

  // Debt
  'Car Payment',
  'Student Loans',
];

// Date Range Vairbles intinalized.
const dateRangeMinInput =  document.querySelector('[ bb-transaction-dateRange="min"]');
const dateRangeMaxInput =  document.querySelector('[ bb-transaction-dateRange="max"]');

dateRangeMinInput.addEventListener('change', ()=>{
        clearTransactionsTable();
        printAllTransactions();
});

dateRangeMaxInput.addEventListener('change', ()=>{
        clearTransactionsTable();
        printAllTransactions();
});

const storedTransactions = localStorage.getItem("transactions");
let currentlyEditingIndex = null;

// Load transactions from local storage if they exist
if (storedTransactions) {
    const parsed = JSON.parse(storedTransactions);
    parsed.forEach((data) => {
        const [dateOnly] = data.date.split('T');
        const transaction = new Transaction(
            data.income,
            dateOnly,
            data.amount,
            data.merchant,
            data.category,
            data.description);
        transactions.push(transaction);
    });

    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
}

setIntinalDateRange();

// Form and button element references
const addTransactionPopup = document.querySelector('[bb-add-transaction="popup"]');
const addTransactionOpenBtn = document.querySelector('[bb-add-transaction="open-button"]');
const transactionForm = document.getElementById("wf-form-Add-Transaction-Form");
const editButton =  transactionForm.querySelector('[bb-edit-transaction="confirm-edits"]');
const deleteButton = transactionForm.querySelector('[bb-edit-transaction="delete-button"]');

// Open transaction form for new entry
addTransactionOpenBtn.addEventListener('click', ()=>{
    transactionForm.querySelector('[bb-edit-transaction="submit-button"]').classList.remove("hidden");
    transactionForm.querySelector('[bb-edit-transaction="button-menu"]').classList.add("hidden");
    addTransactionPopup.classList.remove('hidden');
});

// Close transaction form
const addTransactionCloseBtn = document.querySelector('[bb-add-transaction="close-button"]');
addTransactionCloseBtn.addEventListener('click', ()=>{
    transactionForm.reset();
   addTransactionPopup.classList.add('hidden');
});

// Handle new transaction submission
transactionForm.addEventListener("submit", function (e){
    e.preventDefault(); // Prevent default submission

    // Get form values
    const dateString = transactionForm.querySelector('input[type="date"]').value;   
    const amount = parseFloat(transactionForm.querySelector('#Amount').value);
    const type = transactionForm.querySelector('#Type').value.toLowerCase();
    const merchant = transactionForm.querySelector('#Mechant').value;
    const category = transactionForm.querySelector('#Category').value;
    const description = transactionForm.querySelector('#Description').value;

    // Validate form
    if(isNaN(amount) || !dateString || !merchant || !category){
        alert("Please Fill Out All Fields");
        return;
    }

    // Determine income type
    let isIncome = (type === "income");

    // Create new transaction and save it
    const newTransaction = new Transaction(isIncome, dateString, amount, merchant, category, description);
    transactions.push(newTransaction);
    newTransaction.printTransaction();
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Reset form and update UI
    transactionForm.reset();
    clearTransactionsTable();
    printAllTransactions();
    addTransactionPopup.classList.add('hidden');
});

// Event listener for saving edits
editButton.addEventListener('click', ()=>{
    if(currentlyEditingIndex !=null){
        editTransaction(currentlyEditingIndex);
    }
});

// Event listener for deleting transaction
deleteButton.addEventListener('click', ()=>{
    if(currentlyEditingIndex !=null){
        deleteTransaction(currentlyEditingIndex);
    }
});

// DOM references and initial render
const container = findTransactionContainer();
printAllTransactions();
updateCategoriesInputField();

// Helper to collect template
function collectTransactionItemHTMLTemplate(){
    return document.querySelector('[bb-transaction-item="item"]');
}

// Helper to find the container where transactions are shown
function findTransactionContainer(){
    return document.querySelector('[bb-transaction-container]');
}

// Calculate all expenses
function addExpenses(){
    const withinRange = [];
    const dateRangeMin = dateRangeMinInput.value;
    const dateRangeMax = dateRangeMaxInput.value;
    transactions.forEach(item => {
         if( new Date(dateRangeMin) <= item.date && item.date <= new Date(dateRangeMax)){ //Checks that Date is inside of date range
            withinRange.push(item);
         }
    });
    let expenseSum = 0;
    for(let i = 0; i<withinRange.length; i++){
        if(!withinRange[i].income){
            expenseSum += withinRange[i].amount;
        }
    }
    return expenseSum;
}

// Calculate all income
function addIncome(){
    const withinRange = [];
    const dateRangeMin = dateRangeMinInput.value;
    const dateRangeMax = dateRangeMaxInput.value;
    transactions.forEach(item => {
         if( new Date(dateRangeMin) <= item.date && item.date <= new Date(dateRangeMax)){ //Checks that Date is inside of date range
            withinRange.push(item);
         }
    });
    let incomeSum = 0;
    for(let i = 0; i<withinRange.length; i++){
        if(withinRange[i].income){
            incomeSum += withinRange[i].amount;
        }
    }
    return incomeSum;
}

// Print all transactions to UI
function printAllTransactions(){
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    for(let i = 0; i<transactions.length; i++){
        transactions[i].printTransaction();
    }
    displayTotalOverview();
}

// Fill out form fields with selected transaction data
function setStoredTransactionToForm(index, income, date, amount, merchant, category, description){
    currentlyEditingIndex = index;

    // Populate form fields
    transactionForm.querySelector('#Amount').value = amount;
    transactionForm.querySelector('#Type').value = income ? "Income" : "expense";
    transactionForm.querySelector('#Mechant').value = merchant;
    transactionForm.querySelector('#Category').value = category;
    transactionForm.querySelector('#Description').value = description;
    const formattedDate = date.toISOString().split("T")[0];
    transactionForm.querySelector('input[type="date"]').value = formattedDate;

    // Show edit buttons, hide submit
    transactionForm.querySelector('[bb-edit-transaction="submit-button"]').classList.add("hidden");
    transactionForm.querySelector('[bb-edit-transaction="button-menu"]').classList.remove("hidden");
}

// Replace transaction at index with updated version
function editTransaction(index){
    transactions.splice(index, 1); // Remove old transaction

    // Get form values
    const dateString = transactionForm.querySelector('input[type="date"]').value;   
    const amount = parseFloat(transactionForm.querySelector('#Amount').value);
    const type = transactionForm.querySelector('#Type').value.toLowerCase();
    const merchant = transactionForm.querySelector('#Mechant').value;
    const category = transactionForm.querySelector('#Category').value;
    const description = transactionForm.querySelector('#Description').value;

    if(isNaN(amount) || !dateString || !merchant || !category){
        alert("Please Fill Out All Fields");
        return;
    }

    let isIncome = (type === "income");

    const newTransaction = new Transaction(isIncome, dateString, amount, merchant, category, description);
    transactions.push(newTransaction);
    newTransaction.printTransaction();
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Reset and refresh UI
    transactionForm.reset();
    clearTransactionsTable();
    printAllTransactions();
    addTransactionPopup.classList.add('hidden');
}

// Delete transaction and update UI
function deleteTransaction(index){
    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    clearTransactionsTable();
    printAllTransactions();
    addTransactionPopup.classList.add('hidden');
}

// Clear current list and restore template item
function clearTransactionsTable(){
    const htmlTemplate = collectTransactionItemHTMLTemplate();
    const clone = htmlTemplate.cloneNode(true);
    container.innerHTML = "";
    container.prepend(clone);
}

// Display totals on the dashboard
function displayTotalOverview(){
    const incomeCard = document.querySelector('[bb-transaction-total="income"]');
    const totalIncome = addIncome();
    incomeCard.textContent = `+$${totalIncome}`;

    const spendCard = document.querySelector('[bb-transaction-total="spend"]');
    const totalSpend = addExpenses();
    spendCard.textContent = `-$${totalSpend}`;

    const differenceCard = document.querySelector('[bb-transaction-total="difference"]');
    let totalDifference = totalIncome - totalSpend;
    if(totalDifference < 0){
        totalDifference = totalDifference * -1;
        differenceCard.textContent = `-$${totalDifference}`;
    }
    else
        differenceCard.textContent = `$${totalDifference}`;
}

// Populate category input with default categories
function updateCategoriesInputField(){
    const input = document.querySelector('[bb-transaction-form="category-input"');
    const selectItemTemplate = input.firstChild;
    categories.forEach(category => {
        const newItem = selectItemTemplate.cloneNode();
        newItem.value = category;
        newItem.textContent = category;
        input.appendChild(newItem);
    });
}

function setIntinalDateRange(){
      const now = new Date();

        // Get the first day of the current month
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get the last day of the current month
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Format to YYYY-MM-DD
        const formatDate = (date) => date.toISOString().split("T")[0];

        // Set default values
        dateRangeMinInput.value = formatDate(firstDay);
        dateRangeMaxInput.value = formatDate(lastDay);
}