// Constantes para los porcentajes
const IVA_RATE = 0.13;
const IT_RATE = 0.03;
const IUE_RATE = 0.25;

export function initializeFinancialCalculator() {
    // Obtener todos los inputs numéricos
    const numericInputs = document.querySelectorAll('input[type="number"]');
    
    // Agregar listeners a todos los inputs
    numericInputs.forEach(input => {
        input.addEventListener('input', handleInput);
        input.addEventListener('blur', formatNumber);
    });

    // Inicializar cálculos
    recalculateAll();
}

function handleInput(event) {
    const isMobile = event.target.id.startsWith('mobile-');
    const selectedYear = isMobile ? 
        parseInt(document.getElementById('yearSelectorMobile').value) : 
        parseInt(event.target.id.split('-')[1]);

    if (isMobile) {
        // Sincronizar valor con la vista de escritorio
        const desktopId = event.target.id.replace('mobile-', '') + `-${selectedYear}`;
        const desktopInput = document.getElementById(desktopId);
        if (desktopInput) {
            desktopInput.value = event.target.value;
        }
    } else {
        // Sincronizar valor con la vista móvil si corresponde al año seleccionado
        const currentMobileYear = parseInt(document.getElementById('yearSelectorMobile').value);
        if (selectedYear === currentMobileYear) {
            const mobileId = 'mobile-' + event.target.id.split('-')[0];
            const mobileInput = document.getElementById(mobileId);
            if (mobileInput) {
                mobileInput.value = event.target.value;
            }
        }
    }

    recalculateAll();
}

function recalculateAll() {
    const years = [0, 1, 2, 3, 4, 5];
    const values = {};

    years.forEach(year => {
        // Obtener valores base
        const quantity = getNumericValue(`quantity-${year}`);
        const price = getNumericValue(`price-${year}`);

        // Calcular ingresos
        const operatingIncome = quantity * price;
        values[`operatingIncome-${year}`] = operatingIncome;

        // Calcular impuestos
        const iva = operatingIncome * IVA_RATE;
        const it = operatingIncome * IT_RATE;
        values[`iva-${year}`] = iva;
        values[`it-${year}`] = it;

        // Calcular ingreso neto
        const netIncome = operatingIncome - iva - it;
        values[`netIncome-${year}`] = netIncome;

        // Obtener costos
        const variableCosts = getNumericValue(`variableCosts-${year}`);
        const fixedCosts = getNumericValue(`fixedCosts-${year}`);
        const financialCosts = getNumericValue(`financialCosts-${year}`);
        const depreciation = getNumericValue(`depreciation-${year}`);

        // Calcular utilidad bruta
        const grossProfit = netIncome - variableCosts - fixedCosts - financialCosts - depreciation;
        values[`grossProfit-${year}`] = grossProfit;

        // Calcular IUE
        const iue = grossProfit * IUE_RATE;
        values[`iue-${year}`] = iue;

        // Calcular utilidad neta
        const netProfit = grossProfit - iue;
        values[`netProfit-${year}`] = netProfit;

        // Obtener valores de inversión y capital
        const fixedAssets = getNumericValue(`fixedAssets-${year}`);
        const assetDepreciation = getNumericValue(`assetDepreciation-${year}`);
        const residualValue = getNumericValue(`residualValue-${year}`);
        const workingCapital = getNumericValue(`workingCapital-${year}`);
        const capitalRecovery = getNumericValue(`capitalRecovery-${year}`);
        const loan = getNumericValue(`loan-${year}`);
        const amortization = getNumericValue(`amortization-${year}`);

        // Calcular flujo neto
        const netFlow = netProfit - fixedAssets + assetDepreciation + residualValue 
                       - workingCapital + capitalRecovery + loan - amortization;
        values[`netFlow-${year}`] = netFlow;
    });

    // Actualizar valores en la tabla
    updateTableValues(values);

    // Calcular indicadores financieros
    calculateFinancialIndicators(values);

    // Actualizar vista móvil
    updateMobileValues(values);
}

function getNumericValue(id) {
    const element = document.getElementById(id);
    const mobileElement = document.getElementById(`mobile-${id.split('-')[0]}`);
    
    if (element) {
        return parseFloat(element.value) || 0;
    } else if (mobileElement) {
        return parseFloat(mobileElement.value) || 0;
    }
    return 0;
}

function formatNumber(event) {
    const value = parseFloat(event.target.value) || 0;
    event.target.value = value.toFixed(2);
}

function updateTableValues(values) {
    // Actualizar cada celda calculada en la tabla
    Object.entries(values).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = formatCurrency(value);
        }
    });
}

function updateMobileValues(values) {
    const selectedYear = parseInt(document.getElementById('yearSelectorMobile').value);
    
    // Actualizar valores calculados en la vista móvil
    Object.entries(values).forEach(([key, value]) => {
        const [baseId, year] = key.split('-');
        if (parseInt(year) === selectedYear) {
            const mobileElement = document.getElementById(`mobile-${baseId}`);
            if (mobileElement) {
                mobileElement.textContent = formatCurrency(value);
            }
        }
    });

    // Actualizar flujo neto móvil
    const mobileNetFlow = document.getElementById('mobile-netFlow');
    if (mobileNetFlow) {
        mobileNetFlow.textContent = formatCurrency(values[`netFlow-${selectedYear}`]);
    }
}

function forxmatCurrency(value) {
    return new Intl.NumberFormat('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function calculateFinancialIndicators(values) {
    // Obtener flujos para cálculos
    const flows = Object.entries(values)
        .filter(([key]) => key.startsWith('netFlow-'))
        .map(([, value]) => value);

    // Calcular TIR
    const tir = calculateIRR(flows);
    
    // Obtener tasa de descuento
    const discountRate = getNumericValue('discountRate') / 100;
    
    // Calcular VAN
    const van = calculateNPV(flows, discountRate);
    
    // Actualizar indicadores en la UI
    updateFinancialIndicators(tir, van);
}

function calculateIRR(flows) {
    // Implementar cálculo de TIR
    // Esta es una implementación simplificada
    return 0;
}

function calculateNPV(flows, rate) {
    return flows.reduce((npv, flow, index) => {
        return npv + flow / Math.pow(1 + rate, index);
    }, 0);
}

function updateFinancialIndicators(tir, van) {
    const tirElement = document.getElementById('tir');
    const vanElement = document.getElementById('van');
    
    if (tirElement) tirElement.textContent = `${(tir * 100).toFixed(2)}%`;
    if (vanElement) vanElement.textContent = formatCurrency(van);
} 