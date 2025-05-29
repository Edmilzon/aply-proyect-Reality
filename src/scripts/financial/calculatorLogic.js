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
    const esMovil = evento.target.id.startsWith('mobile-');
    const anioSeleccionado = esMovil ? 
        parseInt(document.getElementById('yearSelectorMobile').value) : 
        parseInt(evento.target.id.split('-')[1]);

    if (esMovil) {
        // Sincronizar valor con la vista de escritorio
        const idEscritorio = evento.target.id.replace('mobile-', '') + `-${anioSeleccionado}`;
        const inputEscritorio = document.getElementById(idEscritorio);
        if (inputEscritorio) {
            inputEscritorio.value = evento.target.value;
        }
    } else {
        // Sincronizar valor con la vista móvil si corresponde al año seleccionado
        const anioMovilActual = parseInt(document.getElementById('yearSelectorMobile').value);
        if (anioSeleccionado === anioMovilActual) {
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
    const anios = [0, 1, 2, 3, 4, 5];
    const valores = {};

    anios.forEach(anio => {
        // Obtener valores base
        const cantidad = obtenerValorNumerico(`quantity-${anio}`);
        const precio = obtenerValorNumerico(`price-${anio}`);

        // Calcular ingresos
        const ingresoOperativo = cantidad * precio;
        valores[`operatingIncome-${anio}`] = ingresoOperativo;

        // Calcular impuestos
        const iva = ingresoOperativo * TASA_IVA;
        const it = ingresoOperativo * TASA_IT;
        valores[`iva-${anio}`] = iva;
        valores[`it-${anio}`] = it;

        // Calcular ingreso neto
        const ingresoNeto = ingresoOperativo - iva - it;
        valores[`netIncome-${anio}`] = ingresoNeto;

        // Obtener costos
        const costosVariables = obtenerValorNumerico(`variableCosts-${anio}`);
        const costosFijos = obtenerValorNumerico(`fixedCosts-${anio}`);
        const costosFinancieros = obtenerValorNumerico(`financialCosts-${anio}`);
        const depreciacion = obtenerValorNumerico(`depreciation-${anio}`);

        // Calcular utilidad bruta
        const utilidadBruta = ingresoNeto - costosVariables - costosFijos - costosFinancieros - depreciacion;
        valores[`grossProfit-${anio}`] = utilidadBruta;

        // Calcular IUE
        const iue = utilidadBruta * TASA_IUE;
        valores[`iue-${anio}`] = iue;

        // Calcular utilidad neta
        const utilidadNeta = utilidadBruta - iue;
        valores[`netProfit-${anio}`] = utilidadNeta;

        // Obtener valores de inversión y capital
        const activosFijos = obtenerValorNumerico(`fixedAssets-${anio}`);
        const depreciacionActivos = obtenerValorNumerico(`assetDepreciation-${anio}`);
        const valorResidual = obtenerValorNumerico(`residualValue-${anio}`);
        const capitalTrabajo = obtenerValorNumerico(`workingCapital-${anio}`);
        const recuperacionCapital = obtenerValorNumerico(`capitalRecovery-${anio}`);
        const prestamo = obtenerValorNumerico(`loan-${anio}`);
        const amortizacion = obtenerValorNumerico(`amortization-${anio}`);

        // Calcular flujo neto
        const flujoNeto = utilidadNeta - activosFijos + depreciacionActivos + valorResidual 
                       - capitalTrabajo + recuperacionCapital + prestamo - amortizacion;
        valores[`netFlow-${anio}`] = flujoNeto;
    });

    // Actualizar valores en la tabla
    actualizarValoresTabla(valores);

    // Calcular indicadores financieros
    calcularIndicadoresFinancieros(valores);

    // Actualizar vista móvil
    actualizarValoresMovil(valores);
}

function obtenerValorNumerico(id) {
    const elemento = document.getElementById(id);
    const elementoMovil = document.getElementById(`mobile-${id.split('-')[0]}`);
    
    if (elemento) {
        return parseFloat(elemento.value) || 0;
    } else if (elementoMovil) {
        return parseFloat(elementoMovil.value) || 0;
    }
    return 0;
}

function formatearNumero(evento) {
    const valor = parseFloat(evento.target.value) || 0;
    evento.target.value = valor.toFixed(2);
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
    
    // Actualizar valores calculados en la vista móvil
    Object.entries(valores).forEach(([clave, valor]) => {
        const [idBase, anio] = clave.split('-');
        if (parseInt(anio) === anioSeleccionado) {
            const elementoMovil = document.getElementById(`mobile-${idBase}`);
            if (elementoMovil) {
                elementoMovil.textContent = formatearMoneda(valor);
            }
        }
    });

    // Actualizar flujo neto móvil
    const flujoNetoMovil = document.getElementById('mobile-netFlow');
    if (flujoNetoMovil) {
        flujoNetoMovil.textContent = formatearMoneda(valores[`netFlow-${anioSeleccionado}`]);
    }
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function calcularIndicadoresFinancieros(valores) {
    // Obtener flujos para cálculos
    const flujos = Object.entries(valores)
        .filter(([clave]) => clave.startsWith('netFlow-'))
        .map(([, valor]) => valor);

    // Calcular TIR
    const tir = calcularTIR(flujos);
    
    // Obtener tasa de descuento
    const tasaDescuento = obtenerValorNumerico('discountRate') / 100;
    
    // Calcular VAN
    const van = calcularVAN(flujos, tasaDescuento);
    
    // Actualizar indicadores en la UI
    actualizarIndicadoresFinancieros(tir, van);
}

function calcularTIR(flujos) {
    // Implementar cálculo de TIR
    // Esta es una implementación simplificada
    return 0;
}

function calcularVAN(flujos, tasa) {
    return flujos.reduce((van, flujo, indice) => {
        return van + flujo / Math.pow(1 + tasa, indice);
    }, 0);
}

function actualizarIndicadoresFinancieros(tir, van) {
    const elementoTIR = document.getElementById('tir');
    const elementoVAN = document.getElementById('van');
    
    if (elementoTIR) elementoTIR.textContent = `${(tir * 100).toFixed(2)}%`;
    if (elementoVAN) elementoVAN.textContent = formatearMoneda(van);
} 