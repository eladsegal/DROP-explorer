
export const noAnswerType = {'key': 'none', 'value': 'None'};
export const noPredictionType = {'key': 'none', 'value': 'None'};
export const answerTypesConst = [
    {'key': 'multi_span', 'value': 'Multi Span', 'accessor': 'spans'},
    {'key': 'single_span', 'value': 'Single Span', 'accessor': 'spans'},
    {'key': 'number', 'value': 'Number', 'accessor': 'number'},
    {'key': 'date', 'value': 'Date', 'accessor': 'date'}
];

export function getAnswerStringForDisplayAndType(answer) {
    let displayAnswer = '';
    let answerType = noAnswerType;
    if ('number' in answer && (answer['number'] === 0 || answer['number'])) {
        const number = answer['number'];
        const number_value = Number(number);
        if (!isNaN(number_value)) {
            displayAnswer = number_value.toString();
        } else {
            displayAnswer = number;
        }
        answerType = answerTypesConst[2]
    } else if ('spans' in answer && answer['spans'] && answer['spans'].length > 0) {
        const spans = answer['spans'];
        if (spans.length === 1) {
            displayAnswer = spans[0];
            answerType = answerTypesConst[1];
        } else {
            displayAnswer = [...spans].sort().join(' ┆ ');           
            answerType = answerTypesConst[0];
        }
    } else if ('date' in answer && answer['date']) {
        const date = answer['date']
        if (['day', 'month', 'year'].some(prop => date[prop] === 0 || date[prop])) {
            displayAnswer = JSON.stringify(date, null, 2);
            answerType = answerTypesConst[3]
        }
    }
    return {'displayAnswer': displayAnswer, answerType}
}

export function getAnswerForEvaluation(answer) {
    // based on answer_json_to_strings from drop_eval.py of allennlp
    let answerForEvaluation = [];
    if ('number' in answer && (answer['number'] === 0 || answer['number'])) {
        const number = answer['number'];
        const number_value = Number(number);
        if (!isNaN(number_value)) {
            answerForEvaluation = [number_value.toString()];
        } else {
            answerForEvaluation = [String(number)];
        }
    } else if ('spans' in answer && answer['spans'] && answer['spans'].length > 0) {
        answerForEvaluation = answer['spans']
    } else if ('date' in answer && answer['date']) {
        const date = answer['date']
        answerForEvaluation = [];
        ['day', 'month', 'year'].forEach(prop => {
            if (date[prop] === 0 || date[prop]) {
                answerForEvaluation.push(String(date[prop]))
            }
        });
    }
    return answerForEvaluation.sort();
}
