/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada
 */
export function formatMoney(amount) {
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Calcula el balance entre debe y haber
 * @param {number} debe - Monto del debe
 * @param {number} haber - Monto del haber
 * @returns {number} Balance calculado
 */
export function calculateBalance(debe, haber) {
    return debe - haber;
}

/**
 * Valida si un valor es numérico
 * @param {any} value - Valor a validar
 * @returns {boolean} True si es numérico
 */
export function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Formatea una fecha al formato local
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
    return new Intl.DateTimeFormat('es-PE').format(date);
} 