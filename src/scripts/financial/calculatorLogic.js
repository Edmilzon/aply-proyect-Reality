// Constantes para los porcentajes
const TASA_IVA = 0.13;
const TASA_IT = 0.03;
const TASA_IUE = 0.25;

export function inicializarCalculadoraFinanciera() {
    // Obtener todos los inputs numéricos
    const inputsNumericos = document.querySelectorAll('input[type="number"]');
    
    // Agregar listeners a todos los inputs
    inputsNumericos.forEach(input => {
        input.addEventListener('input', manejarInput);
        input.addEventListener('blur', formatearNumero);
    });

    // Inicializar cálculos
    recalcularTodo();
}

function manejarInput(evento) {
    recalcularTodo();
}

function recalcularTodo() {
    console.log('Recalculando...');
    const anios = [0, 1, 2, 3, 4, 5];
    const valores = {};

    anios.forEach(anio => {
        const cantidad = obtenerValorNumerico(`quantity-${anio}`);
        const precio = obtenerValorNumerico(`price-${anio}`);

        const ingresoOperativo = cantidad * precio;
        valores[`operatingIncome-${anio}`] = ingresoOperativo;

        const iva = ingresoOperativo * TASA_IVA;
        const it = ingresoOperativo * TASA_IT;
        valores[`iva-${anio}`] = iva;
        valores[`it-${anio}`] = it;

        const ingresoNeto = ingresoOperativo - iva - it;
        valores[`netIncome-${anio}`] = ingresoNeto;

        const unitVariableCost = obtenerValorNumerico(`unitVariableCost-${anio}`);
        const costosVariables = cantidad * unitVariableCost;
        valores[`variableCosts-${anio}`] = costosVariables;
        
        const costosFijos = obtenerValorNumerico(`fixedCosts-${anio}`);
        const costosFinancieros = obtenerValorNumerico(`financialCosts-${anio}`);
        const depreciacion = obtenerValorNumerico(`depreciation-${anio}`);

        const utilidadBruta = ingresoNeto - costosVariables - costosFijos - costosFinancieros - depreciacion;
        valores[`grossProfit-${anio}`] = utilidadBruta;

        const iue = Math.max(0, utilidadBruta) * TASA_IUE;
        valores[`iue-${anio}`] = iue;

        const utilidadNeta = utilidadBruta - iue;
        valores[`netProfit-${anio}`] = utilidadNeta;

        const invActivosFijos = obtenerValorNumerico(`fixedAssets-${anio}`);
        const depreciacionAF = depreciacion;
        valores[`assetDepreciation-${anio}`] = depreciacionAF;
        
        const valorResidual = obtenerValorNumerico(`residualValue-${anio}`);
        
        const kwUtilizado = obtenerValorNumerico(`workingCapitalUtilized-${anio}`);
        const recuperacionKW = obtenerValorNumerico(`capitalRecovery-${anio}`);
        const prestamo = obtenerValorNumerico(`loan-${anio}`);
        const amortizacion = obtenerValorNumerico(`amortization-${anio}`);

        const flujoNeto = utilidadNeta + depreciacionAF - invActivosFijos + valorResidual 
                       - kwUtilizado + recuperacionKW + prestamo - amortizacion;
        valores[`netFlow-${anio}`] = flujoNeto;
    });

    actualizarValoresTabla(valores);
    calcularIndicadoresFinancieros(valores);
}

function obtenerValorNumerico(id) {
    const elemento = document.getElementById(id);
    if (elemento && elemento.tagName === 'INPUT') {
        const valorLimpio = elemento.value.replace(/[, ]/g, '');
        return parseFloat(valorLimpio) || 0;
    }
    return 0;
}

function formatearNumero(evento) {
    let valor = evento.target.value.replace(/,/g, '.');
    if (valor !== '') {
        valor = parseFloat(valor).toFixed(2);
        if (!isNaN(valor)) {
            evento.target.value = valor;
        }
    }
}

function actualizarValoresTabla(valores) {
    Object.entries(valores).forEach(([clave, valor]) => {
        const elemento = document.getElementById(clave);
        if (elemento) {
            elemento.textContent = formatearMoneda(valor);
        }
    });
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-BO', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function calcularIndicadoresFinancieros(valores) {
    const flujos = [];
    for (let i = 0; i <= 5; i++) {
        flujos.push(valores[`netFlow-${i}`] || 0);
    }
    const tir = calcularTIR(flujos);
    const tmar = obtenerValorNumerico('tmarInput') / 100;
    const van = calcularVAN(flujos, tmar);
    actualizarIndicadoresFinancieros(tir, van);
}

function calcularTIR(flujos) {
    const MAX_ITERATIONS = 1000;
    const PRECISION = 0.0001;
    let lowRate = -1;
    let highRate = 1;
    let irr = 0;
    let vanLow = calculateNPV(flujos, lowRate);
    let vanHigh = calculateNPV(flujos, highRate);
    if (vanLow * vanHigh > 0) {
        return NaN;
    }
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        irr = (lowRate + highRate) / 2;
        const npv = calculateNPV(flujos, irr);
        if (Math.abs(npv) < PRECISION) {
            return irr;
        }
        if (npv > 0) {
            lowRate = irr;
        } else {
            highRate = irr;
        }
    }
    return irr;
}

function calculateNPV(flujos, tasa) {
    let npv = 0;
    for (let i = 0; i < flujos.length; i++) {
        npv += flujos[i] / Math.pow(1 + tasa, i);
    }
    return npv;
}

function calcularVAN(flujos, tasa) {
    return flujos.reduce((vanAcumulado, flujo, indice) => {
        return vanAcumulado + flujo / Math.pow(1 + tasa, indice);
    }, 0);
}

function actualizarIndicadoresFinancieros(tir, van) {
    const elementoTIR = document.getElementById('tir');
    const elementoVAN = document.getElementById('van');
    const elementoTMAR = document.getElementById('tmar');
    if (elementoTIR) {
        if (isNaN(tir)) {
            elementoTIR.textContent = 'N/A';
        } else {
            elementoTIR.textContent = `${(tir * 100).toFixed(2)}%`;
        }
    }
    if (elementoVAN) elementoVAN.textContent = formatearMoneda(van);
    if (elementoTMAR) {
        const tmarValor = obtenerValorNumerico('tmarInput');
        elementoTMAR.textContent = `${tmarValor.toFixed(2)}%`;
    }
}

if (typeof window !== "undefined") {
    document.addEventListener('DOMContentLoaded', () => {
        inicializarCalculadoraFinanciera();
    });
}