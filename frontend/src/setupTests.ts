import '@testing-library/jest-dom';

// @testing-library/react@13 usa internamente ReactDOMTestUtils.act (API
// deprecada en React 18) desde su propio act-compat.js, no desde nuestro
// código. No actualizamos la librería porque está fuera del alcance de este
// ejercicio. Filtramos únicamente ese mensaje para mantener la salida limpia
// sin suprimir warnings reales de act() que sí provienen de los tests.
const originalConsoleError = console.error.bind(console);
console.error = (...args: Parameters<typeof console.error>) => {
    // React llama console.error con formato '%s' + args separados, por lo que
    // args[0] puede ser solo el string de formato; buscamos en todos los argumentos.
    const isDeprecatedActWarning = args.some(
        (arg) => typeof arg === 'string' && arg.includes('ReactDOMTestUtils.act')
    );
    if (isDeprecatedActWarning) {
        return;
    }
    originalConsoleError(...args);
};
