export function parseStringChange(input) {
    if (typeof input === 'number') {
        return {
            template: '{0}',
            values:   [{ value: input, unit: '' }],
        };
    }

    const str     = String(input);
    const regex   = /([-+]?[\d.]+)([a-zA-Z%]*)/g;
    const values  = [];
    let template  = str;
    let offset    = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
        const fullMatch = match[0];
        const value     = parseFloat(match[1]);
        const unit      = match[2] || '';
        const index     = values.length;

        values.push({ value, unit });

        const placeholder = `{${index}}`;
        const position    = match.index - offset;
        template          = template.slice(0, position) + placeholder + template.slice(position + fullMatch.length);
        offset           += fullMatch.length - placeholder.length;
    }

    return { template, values };
}

function normalizeFunctionOrder(fromStr, toStr) {
    const funcRegex  = /([a-zA-Z][a-zA-Z0-9]*)\([^)]+\)/g;
    const fromFuncs  = [...String(fromStr).matchAll(funcRegex)];
    const toFuncs    = [...String(toStr).matchAll(funcRegex)];

    if (fromFuncs.length === 0 || toFuncs.length === 0) {
        return { from: fromStr, to: toStr };
    }

    const fromByName = {};
    const toByName   = {};

    fromFuncs.forEach(match => fromByName[match[1]] = match[0]);
    toFuncs.forEach(match => toByName[match[1]] = match[0]);

    const sortedNames = [...new Set([...Object.keys(fromByName), ...Object.keys(toByName)])].sort();

    return {
        from: sortedNames.map(name => fromByName[name]).filter(Boolean).join(' '),
        to:   sortedNames.map(name => toByName[name]).filter(Boolean).join(' '),
    };
}

export function parseStringChanges(values) {
    const normalized = normalizeFunctionOrder(values.from, values.to);
    const from       = parseStringChange(normalized.from);
    const to         = parseStringChange(normalized.to);

    if (from.values.length !== to.values.length) {
        console.warn('VanillaScroll: from and to values have different number of numeric values');
    }

    from.values.forEach((fromValue, index) => {
        const toValue = to.values[index];
        if (toValue) {
            if (toValue.unit && !fromValue.unit) {
                fromValue.unit = toValue.unit;
            } else if (fromValue.unit && !toValue.unit) {
                toValue.unit = fromValue.unit;
            }
        }
    });

    return {
        template: from.template,
        from:     from.values,
        to:       to.values,
    };
}

export function reconstructValue(template, values) {
    let result = template;
    values.forEach((value, index) => {
        result = result.replace(`{${index}}`, `${value.value.toFixed(2)}${value.unit}`);
    });
    return result;
}

export function reconstructValueRaw(template, values) {
    let result = template;
    values.forEach((value, index) => {
        result = result.replace(`{${index}}`, `${value.value}${value.unit}`);
    });
    return result;
}
