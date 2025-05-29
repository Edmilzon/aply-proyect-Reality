// Importamos las utilidades
import { formatMoney, calculateBalance } from '../../utils/contabilityHelpers';

export function initializeTable() {
    const tableBody = document.getElementById('tableBody');
    const addRowButton = document.getElementById('addRow');
    const calculateTotalButton = document.getElementById('calculateTotal');

    // Evento para agregar nueva fila
    addRowButton.addEventListener('click', () => {
        const newRow = document.querySelector('tr').cloneNode(true);
        clearInputs(newRow);
        setupRowEvents(newRow);
        tableBody.appendChild(newRow);
    });

    // Evento para calcular totales
    calculateTotalButton.addEventListener('click', calculateTotals);

    // Configurar eventos iniciales
    setupInitialEvents();
}

function setupInitialEvents() {
    // Configurar eventos para la primera fila
    const firstRow = document.querySelector('tr');
    if (firstRow) {
        setupRowEvents(firstRow);
    }

    // Eventos para inputs monetarios
    document.querySelectorAll('.money-input').forEach(input => {
        input.addEventListener('input', handleMoneyInput);
        input.addEventListener('blur', formatMoneyOnBlur);
    });
}

function setupRowEvents(row) {
    // Configurar botón de eliminar
    const deleteButton = row.querySelector('.delete-row');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            row.remove();
            calculateTotals();
        });
    }

    // Configurar inputs monetarios
    row.querySelectorAll('.money-input').forEach(input => {
        input.addEventListener('input', handleMoneyInput);
        input.addEventListener('blur', formatMoneyOnBlur);
    });
}

function handleMoneyInput(event) {
    const row = event.target.closest('tr');
    const debe = parseFloat(row.querySelector('input[type="number"]:nth-of-type(1)').value) || 0;
    const haber = parseFloat(row.querySelector('input[type="number"]:nth-of-type(2)').value) || 0;
    
    const balance = calculateBalance(debe, haber);
    row.querySelector('.balance-cell').textContent = formatMoney(balance);
    
    calculateTotals();
}

function formatMoneyOnBlur(event) {
    const value = parseFloat(event.target.value) || 0;
    event.target.value = formatMoney(value);
}

function calculateTotals() {
    let totalDebe = 0;
    let totalHaber = 0;

    document.querySelectorAll('tr:not(:first-child)').forEach(row => {
        const debe = parseFloat(row.querySelector('input[type="number"]:nth-of-type(1)').value) || 0;
        const haber = parseFloat(row.querySelector('input[type="number"]:nth-of-type(2)').value) || 0;
        
        totalDebe += debe;
        totalHaber += haber;
    });

    const totalBalance = calculateBalance(totalDebe, totalHaber);

    document.querySelector('.total-debe').textContent = formatMoney(totalDebe);
    document.querySelector('.total-haber').textContent = formatMoney(totalHaber);
    document.querySelector('.total-balance').textContent = formatMoney(totalBalance);
}

function clearInputs(row) {
    row.querySelectorAll('input').forEach(input => {
        input.value = '';
    });
    row.querySelector('.balance-cell').textContent = '0.00';
} 