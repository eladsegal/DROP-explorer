
export const nonAnswerType = {'key': 'none', 'value': 'None'};
export const answerTypes = [
    {'key': 'multi_span', 'value': 'Multi Span'},
    {'key': 'single_span', 'value': 'Single Span'},
    {'key': 'number', 'value': 'Number'},
    {'key': 'date', 'value': 'Date'}
];
export const predictionTypes = [
    ...answerTypes,
    nonAnswerType
];

export function getAnswerType(answerDict) {
    let answerType = nonAnswerType;

    const span_count = answerDict['spans'].length
    if (span_count > 0) {
        if (span_count === 1) {
            answerType = 'single_span'
        } else {
            answerType = 'multi_span'
        }
    }
    else if (answerDict['number']) {
        answerType = 'number'
    } else {
        const date = answerDict['date']
        if (date && (date.day || date.month || date.year)) {
            answerType = 'date';
        }
    }
    return answerType;
}

export function getAnswerField(answerDict) {
    let answerField = null;

    const span_count = answerDict['spans'].length
    if (span_count > 0) {
        answerField = {key: 'spans', name: span_count > 1 ? 'Multi Span' : 'Single Span'}
    }
    else if (answerDict['number']) {
        answerField = {key: 'number', name: 'Number'};
    } else {
        const date = answerDict['date']
        if (date && (date.day || date.month || date.year)) {
            answerField = {key: 'date', name: 'Date'};
        }
    }

    return answerField;
}

export function getAnswerForDisplay(raw_value) {
    let value = raw_value;
    if (Array.isArray(value) && value.length === 1) {
        value = value[0];
    } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
            value = [...value].sort()
        }
        value = JSON.stringify(value, null, 2);
    } else {
        value = Number(value)
    }
    return value;
}

export function answerAccessor(qa_pair) {
    const answer = qa_pair.answer;
    const answerField = getAnswerField(answer); 
    if (answerField) {
        return getAnswerForDisplay(answer[answerField.key]).toString();
    }
    return '';
}

export function answerTypeAccessor(qa_pair) {
    const answerField = getAnswerField(qa_pair.answer);
    if (answerField) {
        return answerField.name;
    }
    return '';
}

export function predictionAccessor(qa_pair) {
    const prediction = qa_pair.prediction;
    if (prediction) {
        return getAnswerForDisplay(qa_pair.prediction).toString();
    }
    return '';
}
export function predictionTypeAccessor(qa_pair) {
    const prediction = qa_pair.prediction;
    if (prediction) {
        const answerField = getAnswerField({'spans': prediction});
        if (answerField) {
            return answerField.name;
        }
    }
    return '';
}