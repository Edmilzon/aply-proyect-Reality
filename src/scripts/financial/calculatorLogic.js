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

    // Añadir listener al selector de año móvil si existe
    const yearSelectorMobile = document.getElementById('yearSelectorMobile');
    if (yearSelectorMobile) {
        yearSelectorMobile.addEventListener('change', recalcularTodo);
    }

    // Inicializar cálculos
    recalcularTodo();
}

function manejarInput(evento) {
    console.log('Input cambiado:', evento.target.id, evento.target.value);
    const esMovil = evento.target.id.startsWith('mobile-');
    let anioSeleccionado;

    if (esMovil) {
        anioSeleccionado = parseInt(document.getElementById('yearSelectorMobile').value);
    } else {
        anioSeleccionado = parseInt(evento.target.id.split('-')[1]);
    }

    if (esMovil) {
  
        const idEscritorioBase = evento.target.id.replace('mobile-', ''); 
        const inputEscritorio = document.getElementById(`${idEscritorioBase}-${anioSeleccionado}`);
        if (inputEscritorio) {
            inputEscritorio.value = evento.target.value;
        }
    } else {
        const anioMovilActual = parseInt(document.getElementById('yearSelectorMobile').value);
        if (anioSeleccionado === anioMovilActual) {
            // El ID móvil no incluye el año, e.g., 'mobile-quantity'
            const idMovil = 'mobile-' + evento.target.id.split('-')[0]; 
            const inputMovil = document.getElementById(idMovil);
            if (inputMovil) {
                inputMovil.value = evento.target.value;
            }
        }
    }

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

        const unitVariableCost = obtenerValorNumerico(`unitVariableCost-${anio}`); // NUEVO ID
        // Calcular Costos Variables Totales
        const costosVariables = cantidad * unitVariableCost; // Cálculo basado en input de Cantidad y Costo Unitario
        valores[`variableCosts-${anio}`] = costosVariables; // Asignar al ID del campo calculado
        
        const costosFijos = obtenerValorNumerico(`fixedCosts-${anio}`);
        const costosFinancieros = obtenerValorNumerico(`financialCosts-${anio}`);
        const depreciacion = obtenerValorNumerico(`depreciation-${anio}`); // Este es el input de Depreciación

        const utilidadBruta = ingresoNeto - costosVariables - costosFijos - costosFinancieros - depreciacion;
        valores[`grossProfit-${anio}`] = utilidadBruta;

        const iue = Math.max(0, utilidadBruta) * TASA_IUE;
        valores[`iue-${anio}`] = iue;

        // Utilidad Neta = Utilidad Bruta - IUE
        const utilidadNeta = utilidadBruta - iue;
        valores[`netProfit-${anio}`] = utilidadNeta;

        const invActivosFijos = obtenerValorNumerico(`fixedAssets-${anio}`); // (-)Inv. Activos Fijos

        const depreciacionAF = depreciacion; // AHORA TOMA EL VALOR DEL INPUT 'depreciacion'
        valores[`assetDepreciation-${anio}`] = depreciacionAF; // Asignar este valor al campo 'calculated'
        
        const valorResidual = obtenerValorNumerico(`residualValue-${anio}`); // (+)Valor Residual
        
        const kwUtilizado = obtenerValorNumerico(`workingCapitalUtilized-${anio}`); // NUEVO ID para "(-) Kw utilizado"
        const recuperacionKW = obtenerValorNumerico(`capitalRecovery-${anio}`); // (+)Recuperacion de KW
        const prestamo = obtenerValorNumerico(`loan-${anio}`); // (+)Préstamo
        const amortizacion = obtenerValorNumerico(`amortization-${anio}`); // (-)Amortizac. Finan.

        // Flujo de Efectivo Neto
        const flujoNeto = utilidadNeta + depreciacionAF - invActivosFijos + valorResidual 
                       - kwUtilizado + recuperacionKW + prestamo - amortizacion;
        valores[`netFlow-${anio}`] = flujoNeto;
    });

    // Actualizar valores en la tabla
    actualizarValoresTabla(valores);

    // Calcular indicadores financieros (TIR y VAN)
    calcularIndicadoresFinancieros(valores);

    // Actualizar vista móvil
    actualizarValoresMovil(valores);
}

function obtenerValorNumerico(id) {
    const elemento = document.getElementById(id);

    if (elemento && elemento.tagName === 'INPUT') { // Asegura que solo se intente leer .value de inputs
        const valorLimpio = elemento.value.replace(/[, ]/g, '');
        return parseFloat(valorLimpio) || 0;
    } 
    
    const idBase = id.includes('-') ? id.split('-')[0] : id; // Extrae 'quantity' de 'quantity-0'
    const elementoMovil = document.getElementById(`mobile-${idBase}`);
    if (elementoMovil && elementoMovil.tagName === 'INPUT') {
        const valorLimpio = elementoMovil.value.replace(/[, ]/g, '');
        return parseFloat(valorLimpio) || 0;
    }

    return 0;
}

function formatearNumero(evento) {
    const valor = parseFloat(evento.target.value) || 0;
    // Formatea a 2 decimales y añade separadores de miles
    evento.target.value = new Intl.NumberFormat('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function actualizarValoresTabla(valores) {
    // Actualizar cada celda calculada en la tabla
    Object.entries(valores).forEach(([clave, valor]) => {
        const elemento = document.getElementById(clave);
        if (elemento) {
            elemento.textContent = formatearMoneda(valor);
        }
    });
}

function actualizarValoresMovil(valores) {
    const anioSeleccionado = parseInt(document.getElementById('yearSelectorMobile').value);
    
    Object.entries(valores).forEach(([clave, valor]) => {
        const [idBase, anio] = clave.split('-');
        if (parseInt(anio) === anioSeleccionado) {
            const elementoMovil = document.getElementById(`mobile-${idBase}`);
            // Solo actualiza textContent si es un DIV (elemento calculado)
            if (elementoMovil && elementoMovil.tagName !== 'INPUT') { 
                elementoMovil.textContent = formatearMoneda(valor);
            }
        }
    });

    const flujoNetoMovil = document.getElementById('mobile-netFlow');
    if (flujoNetoMovil) {
        flujoNetoMovil.textContent = formatearMoneda(valores[`netFlow-${anioSeleccionado}`]);
    }
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-BO', { // Asumiendo formato de Bolivia por el idioma 'es-BO'
        style: 'decimal', // Usar decimal para números generales, no currency
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function calcularIndicadoresFinancieros(valores) {
    // Obtener flujos para cálculos
    const flujos = [];
    for (let i = 0; i <= 5; i++) {
        flujos.push(valores[`netFlow-${i}`] || 0); // Asegurarse de que existan los valores
    }

    // Calcular TIR
    const tir = calcularTIR(flujos);

    const tmar = obtenerValorNumerico('tmarInput') / 100; // Obtener del input 'tmarInput' y dividir por 100
    
    // Calcular VAN
    const van = calcularVAN(flujos, tmar);

    actualizarIndicadoresFinancieros(tir, van);
}

function calcularTIR(flujos) {
    const MAX_ITERATIONS = 1000;
    const PRECISION = 0.0001;
    let lowRate = -1; // Un valor bajo para empezar la búsqueda
    let highRate = 1; // Un valor alto para empezar la búsqueda
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
    return irr; // Retorna la mejor aproximación después de las iteraciones
}

function calculateNPV(flujos, tasa) {
    let npv = 0;
    for (let i = 0; i < flujos.length; i++) {
        npv += flujos[i] / Math.pow(1 + tasa, i);
    }
    return npv;
}

function calcularVAN(flujos, tasa) {
    // El primer flujo (Año 0) no se descuenta
    return flujos.reduce((vanAcumulado, flujo, indice) => {
        return vanAcumulado + flujo / Math.pow(1 + tasa, indice);
    }, 0);
}

function actualizarIndicadoresFinancieros(tir, van) {
    const elementoTIR = document.getElementById('tir');
    const elementoVAN = document.getElementById('van');
    const elementoTMAR = document.getElementById('tmar'); // Obtiene el span donde se muestra la TMAR
    
    if (elementoTIR) {
        if (isNaN(tir)) {
            elementoTIR.textContent = 'N/A'; // O un mensaje de error si no se pudo calcular
        } else {
            elementoTIR.textContent = `${(tir * 100).toFixed(2)}%`;
        }
    }
    if (elementoVAN) elementoVAN.textContent = formatearMoneda(van);
    
    if (elementoTMAR) {
        const tmarValor = obtenerValorNumerico('tmarInput'); // Obtiene el valor del input de TMAR
        elementoTMAR.textContent = `${tmarValor.toFixed(2)}%`; // Muestra el valor del input
    }
}