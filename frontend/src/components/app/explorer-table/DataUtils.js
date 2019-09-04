import { answerTypesConst, getAnswerStringForDisplayAndType, getAnswerForEvaluation,
    noAnswerType, noPredictionType } from '../AnswersUtils';
import { intersect } from '../../Utils';

export function processDataHelper(dataset, predictions) {

    let hasValidatedAnswers = false;
    let hasValidPredictions = false;
    let passage_id_to_displayIndex = {};
    let passage_id_to_queries_displayIndexes = {};
    let predictionTypes = []
    let data = [];
    if (dataset) {
        const reduced = dataset.reduce(process_row, {
            data: [],
            hasValidatedAnswers: false,
            passage_id_to_displayIndex: {},
            passage_id_to_queries_displayIndexes: {}
        });
        data = reduced.data;
        hasValidatedAnswers = reduced.hasValidatedAnswers;
        passage_id_to_displayIndex = reduced.passage_id_to_displayIndex;
        passage_id_to_queries_displayIndexes = reduced.passage_id_to_queries_displayIndexes;

        if (predictions) {
            const keyToPredictionType = {}
            for (let i=0; i < predictions.length; i++) {
                const prediction = predictions[i];

                const passage_id = prediction.passage_id;
                const query_id = prediction.query_id;

                const passage_displayIndex =passage_id_to_displayIndex[passage_id];
                if (passage_displayIndex !== undefined) {
                    const row = data[passage_displayIndex];

                    const query_displayIndex = passage_id_to_queries_displayIndexes[passage_id][query_id];
                    if (query_displayIndex !== undefined) {
                        hasValidPredictions = true;
                        let qa_pair = row.qa_pairs[passage_id_to_queries_displayIndexes[passage_id][query_id]]
                        if (qa_pair.prediction) {
                            // only needed because there's a duplication of query_id in the dev dataset
                            qa_pair = row.qa_pairs.find(q => q.query_id === qa_pair.query_id && !q.prediction)
                            if (!qa_pair) {
                                continue;
                            }
                        }

                        let predictionType = keyToPredictionType[prediction.predicted_ability]
                        if (!predictionType) {
                            predictionType = keyToPredictionType[prediction.predicted_ability] = {
                                'key': prediction.predicted_ability, 
                                'value': prediction.predicted_ability
                            };
                            predictionTypes.push(predictionType);
                        }

                        const predictionValue = prediction.answer.value;

                        qa_pair.prediction = Array.isArray(predictionValue) ? predictionValue : [predictionValue];
                        qa_pair.displayPrediction = getAnswerStringForDisplayAndType({'spans': qa_pair.prediction}).displayAnswer;
                        qa_pair.predictionType = predictionType;
                        qa_pair.maximizingGroundTruth = prediction.maximizing_ground_truth.sort();
                        qa_pair.f1 = prediction.f1;
                        qa_pair.em = prediction.em;
                        qa_pair.loss = prediction.loss;
                        qa_pair.max_passage_length = prediction.max_passage_length === -1 ? undefined : prediction.max_passage_length;

                        if (predictionType.key !== 'arithmetic') {
                            qa_pair.evaluationPrediction = getAnswerForEvaluation({'spans': qa_pair.prediction});
                        } else {
                            const numbers = []
                            const signs = []                           
                            prediction.answer.numbers.filter(number => number.sign !== 0).forEach(number => {
                                numbers.push(number.value)
                                signs.push(number.sign === -1 ? '-' : '+')
                            })

                            if (numbers.length <= 1) {
                                qa_pair.evaluationPrediction = getAnswerForEvaluation({'spans': qa_pair.prediction});
                            } else {
                                qa_pair.displayPrediction = `${
                                    numbers.map((number, index) => {
                                        const sign = signs[index]
                                        return `${index === 0 && sign === '+' ? '' : sign}${index === 0 ? '' : ' '}${number.toLocaleString()}`;
                                    }).join(' ')
                                } = ${Number(qa_pair.displayPrediction).toLocaleString()}`

                                qa_pair.evaluationPrediction = getAnswerForEvaluation({'spans': numbers.map(x => x.toLocaleString())});
                            }
                        }

                        const maximizingGroundTruth = qa_pair.maximizingGroundTruth;
                        const maximizingGroundTruthIndex = qa_pair.evaluationAnswers.findIndex(evaluationAnswer => {
                            if (evaluationAnswer.length !== maximizingGroundTruth.length) {
                                return false;
                            }
                            for (let i = 0; i < evaluationAnswer.length; i++) {
                                if (evaluationAnswer[i].toLowerCase() !== maximizingGroundTruth[i].toLowerCase()) {
                                    return false;
                                }
                            }
                            return true;
                        });
                        if (maximizingGroundTruthIndex !== -1) {
                            qa_pair.maximizingGroundTruthIndex = maximizingGroundTruthIndex;
                        }
                        
                        const predictionSpans = prediction.answer.spans;
                        if (predictionSpans && predictionSpans.length > 0) {
                            qa_pair.predictionSpans = predictionSpans;
                        }
                    } else {
                        continue;
                    }
                }
                else {
                    continue;
                }
            }
        }
    }

    predictionTypes.sort()
    predictionTypes.push(noAnswerType)

    return {
        data,
        hasValidatedAnswers,
        hasValidPredictions,
        predictionTypes
    };
}

function process_row(accumulator, row, index) {
    const passage_id = row.passage_id;
    const passage_displayIndex = accumulator.data.length;

    const reduced = row.qa_pairs.reduce(process_qa_pair, {
        passage_id: passage_id, 
        qa_pairs: [],
        hasValidatedAnswers: accumulator.hasValidatedAnswers,
        query_id_to_displayIndex: {}
    });
    const qa_pairs = reduced.qa_pairs;
    accumulator.hasValidatedAnswers = reduced.hasValidatedAnswers;
    const query_id_to_displayIndex = reduced.query_id_to_displayIndex;

    const hasQuestions = qa_pairs.length !== 0;
    const isValid = hasQuestions;

    if (isValid) {
        const reduced_row = {
            ...row,
            passage: row.passage.trim(),
            qa_pairs,
            passage_index: index
        }
        
        accumulator.data.push(reduced_row);
        accumulator.passage_id_to_displayIndex[passage_id] = passage_displayIndex;
        accumulator.passage_id_to_queries_displayIndexes[passage_id] = query_id_to_displayIndex
    }
    return accumulator;
}

function process_qa_pair(accumulator, qa_pair, query_index) {
    const query_displayIndex = accumulator.qa_pairs.length;
    const passage_id = accumulator.passage_id;

    if (!accumulator.hasValidatedAnswers && qa_pair.validated_answers && qa_pair.validated_answers.length > 0) {
        accumulator.hasValidatedAnswers = true;
    }

    const {displayAnswer: firstDisplayAnswer, answerType: firstAnswerType} = getAnswerStringForDisplayAndType(qa_pair.answer);
    const displayAnswers = [firstDisplayAnswer];
    const answersTypes = [firstAnswerType];

    const evaluationAnswers = [getAnswerForEvaluation(qa_pair.answer)]

    if (firstAnswerType === noAnswerType) {
        return accumulator;
    }

    if (qa_pair.validated_answers && qa_pair.validated_answers.length > 0) {
        qa_pair.validated_answers.forEach(validatedAnswer => {
            const evaluationAnswer = getAnswerForEvaluation(validatedAnswer)

            const alreadyAdded = evaluationAnswers.some(addedEvaluationAnswer => {
                if (addedEvaluationAnswer.length !== evaluationAnswer.length) {
                    return false;
                }
                for (let i = 0; i < evaluationAnswer.length; i++) {
                    if (evaluationAnswer[i].toLowerCase() !== addedEvaluationAnswer[i].toLowerCase()) {
                        return false;
                    }
                }
                return true;
            });

            if (!alreadyAdded) {
                const {displayAnswer, answerType} = getAnswerStringForDisplayAndType(validatedAnswer);
                displayAnswers.push(displayAnswer);
                answersTypes.push(answerType);

                evaluationAnswers.push(getAnswerForEvaluation(validatedAnswer));
            }
        });
    }
    
    accumulator.qa_pairs.push({
        ...qa_pair,
        question: qa_pair.question.trim(),
        evaluationAnswers,
        displayAnswers,
        answersTypes,
        maximizingGroundTruthIndex: 0,
        query_index,
        passage_id
    })
    accumulator.query_id_to_displayIndex[qa_pair.query_id] = query_displayIndex;
    
    return accumulator;
}


export function filterDataHelper(internals, filteredAnswerTypes, answerTypeFilterFirstOnly, answerTypeFilterStrict, 
                                filteredPredictionTypes, searchProps, F1Range, EMRange, clippedFilter) {
    const data = internals.data; 
    const filteredDataPerFilter = internals.filteredDataPerFilter;       

    const searchText = searchProps.searchText;
    const useTextSearch = Boolean(searchText);

    if (useTextSearch) {
        if (!filteredDataPerFilter.search) {
            const reduced = data.reduce(searchReudcer_rows, {
                filteredData: [],
                searchProps,
                hasValidPredictions: internals.hasValidPredictions
            })
            const result = reduced.filteredData;

            filteredDataPerFilter.search = result;
        }
    }

    if (!filteredDataPerFilter.answerTypes) {
        if (filteredAnswerTypes.length > 0) {
            if (filteredAnswerTypes.length < answerTypesConst.length || answerTypeFilterStrict) {
                const reduced = data.reduce(typeFilterReudcer_rows, {
                    filteredData: [],
                    filteredTypes: filteredAnswerTypes,
                    fields: ['answersTypes'],
                    missingValue: noAnswerType,
                    firstOnly: answerTypeFilterFirstOnly,
                    strict: answerTypeFilterStrict
                });
                const result = reduced.filteredData;

                filteredDataPerFilter.answerTypes = result;
            }
        } else {
            filteredDataPerFilter.answerTypes = [];
        }
    }

    if (internals.hasValidPredictions && !filteredDataPerFilter.predictionTypes) {
        if (filteredPredictionTypes.length > 0) {
            const reduced = data.reduce(typeFilterReudcer_rows, {
                filteredData: [],
                filteredTypes: filteredPredictionTypes,
                fields: ['predictionType'],
                missingValue: noPredictionType,
                strict: false
            });
            const result = reduced.filteredData;

            filteredDataPerFilter.predictionTypes = result;
        } else {
            filteredDataPerFilter.predictionTypes = [];
        }
    }

    if (internals.hasValidPredictions && !filteredDataPerFilter.F1Range) {
        const range = F1Range;
        if (range.low <= range.high) {
            const reduced = data.reduce(rangeFilterReudcer_rows, {
                filteredData: [],
                range,
                field: 'f1'
            });
            const result = reduced.filteredData;

            filteredDataPerFilter.F1Range = result;
        } else {
            filteredDataPerFilter.F1Range = [];
        }
    }

    if (internals.hasValidPredictions && !filteredDataPerFilter.EMRange) {
        const range = EMRange;
        if (range.low <= range.high) {
            const reduced = data.reduce(rangeFilterReudcer_rows, {
                filteredData: [],
                range,
                field: 'em'
            });
            const result = reduced.filteredData;

            filteredDataPerFilter.EMRange = result;
        } else {
            filteredDataPerFilter.EMRange = [];
        }
    }

    if (internals.hasValidPredictions && !filteredDataPerFilter.clipped) {
        const showClipped = clippedFilter.showClipped;
        const showUnclipped = clippedFilter.showUnclipped;
        if (showClipped || showUnclipped) {
            if (showClipped && showUnclipped) {
                filteredDataPerFilter.clipped = data;
            } else {
                const reduced = data.reduce(clippedFilterReudcer_rows, {
                    filteredData: [],
                    showClipped,
                    showUnclipped,
                });
                const result = reduced.filteredData;
    
                filteredDataPerFilter.clipped = result;
            }
        } else {
            filteredDataPerFilter.clipped = []
        }
    }

    let filteredData = intersectFilteredData(filteredDataPerFilter, data.length);

    if (!filteredData) {
        filteredData = data;
    }

    const metrics = {
        questionsCount: 0,
        predictedCount: 0,
        f1: 0,
        em: 0
    }

    for (let i=0; i < filteredData.length; i++) {
        const row = filteredData[i];

        metrics.questionsCount += row.qa_pairs.length;

        let row_predicted = 0;
        let row_f1 = 0;
        let row_em = 0;
        if (internals.hasValidPredictions) {
            for (let j=0; j < row.qa_pairs.length; j++) {
                const qa_pair = row.qa_pairs[j];
    
                if (qa_pair.prediction) {
                    row_predicted += 1;
                    row_f1 += qa_pair.f1;
                    row_em += qa_pair.em;
                }
            }
        }
        metrics.f1 += row_f1;
        metrics.em += row_em;
        metrics.predictedCount += row_predicted;

        if (row_predicted > 0) {
            row.f1 = row_f1 / row_predicted;
            row.em = row_em / row_predicted;
        }
    }
    if (metrics.predictedCount > 0) {
        metrics.f1 /= metrics.predictedCount;
        metrics.em /= metrics.predictedCount;
    } else {
        metrics.f1 = undefined;
        metrics.em = undefined;
    }


    return {
        filteredData,
        filteredDataPerFilter,
        metrics
    };
}

function intersectFilteredData(filteredDataPerFilter) {
    const filteredDataArr = Object.values(filteredDataPerFilter).filter(filteredData => Boolean(filteredData))
    const filtersCount = filteredDataArr.length;

    if (filtersCount === 0) {
        return;
    }

    if (filtersCount === 1) {
        return filteredDataArr[0];
    }

    const allNonEmpty = filteredDataArr.every(filteredData => filteredData.length > 0);
    if (!allNonEmpty) {
        return [];
    }

    return intersect(filteredDataArr, row => row.passage_index, intersectRows);
}

function intersectRows(sameRows) {
    const qa_pairs_arr = sameRows.map(row => row.qa_pairs);

    const filtered_qa_pairs = intersect(qa_pairs_arr, qa_pair => qa_pair.query_index, (sameQuestions) => {
        return Object.assign({}, ...sameQuestions);
    });

    if (filtered_qa_pairs.length > 0) {
        return Object.assign({}, ...sameRows, {'qa_pairs': filtered_qa_pairs});
    }
    return;
}

// Text Search Filtering
function searchReudcer_rows(accumulator, row) {
    const searchProps = accumulator.searchProps;
    const searchText = searchProps.searchText;

    const passageTextSearchValid = row.passage.toLowerCase().includes(searchText) || 
                                    row.passage_id.toLowerCase().includes(searchText);

    let filtered_qa_pairs = row.qa_pairs;
    let hasTextSearchValidQuestions = false;

    if (searchProps.filterQuestions) {
        filtered_qa_pairs = row.qa_pairs.filter(qa_pair => {
            return isQuestionTextSearchValid(qa_pair, searchText, accumulator.hasValidPredictions);
        });

        hasTextSearchValidQuestions = filtered_qa_pairs.length > 0;

    } else if (!passageTextSearchValid) {

        hasTextSearchValidQuestions = row.qa_pairs.some(qa_pair => {
            return isQuestionTextSearchValid(qa_pair, searchText, accumulator.hasValidPredictions);
        });
    }

    const hasQuestions = filtered_qa_pairs.length > 0;
    const isValid = (passageTextSearchValid && hasQuestions) || hasTextSearchValidQuestions;

    if (isValid) {
        accumulator.filteredData.push({
            ...row,
            qa_pairs: filtered_qa_pairs,
        });
    }
    return accumulator;
}
function isQuestionTextSearchValid(qa_pair, searchText, hasValidPredictions) {
    let result = qa_pair.question.toLowerCase().includes(searchText) ||
                qa_pair.query_id.toLowerCase().includes(searchText);
    if (result) {
        return true;
    }

    for (let i = 0; i < qa_pair.evaluationAnswers.length; i++) {
        const evaluationAnswer = qa_pair.evaluationAnswers[i];
        for (let j = 0; j < evaluationAnswer.length; j++) {
            result |= evaluationAnswer[j].toLowerCase().includes(searchText);

            if (result) {
                break;
            }
        }
        if (result) {
            break;
        }
    }
    if (result) {
        return true;
    }

    if (hasValidPredictions) {
        const evaluationPrediction = qa_pair.evaluationPrediction;
        if (evaluationPrediction) {
            result = evaluationPrediction.some(x => {
                return x.toLowerCase().includes(searchText)
            });
        }
    }

    return result;
}

// Type Filtering
function typeFilterReudcer_rows(accumulator, row) {
    const filteredTypes = accumulator.filteredTypes;

    const { filtered_qa_pairs } = row.qa_pairs.reduce(typeFilterReudcer_qa_pairs, {
        filtered_qa_pairs: [],
        filteredTypes,
        fields: accumulator.fields,
        missingValue: accumulator.missingValue,
        firstOnly: accumulator.firstOnly,
        strict: accumulator.strict
    });

    const hasQuestions = filtered_qa_pairs.length > 0;
    const isValid = hasQuestions;

    if (isValid) {
        accumulator.filteredData.push({
            ...row,
            qa_pairs: filtered_qa_pairs,
        });
    }
    return accumulator;
}
function typeFilterReudcer_qa_pairs(accumulator, qa_pair) {
    const filteredTypes = accumulator.filteredTypes;
    const fields = accumulator.fields;
    const firstOnly = accumulator.firstOnly;
    const strict = accumulator.strict;

    const foundTypes = new Set();
    let typeValid = false;
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];

        const obj = qa_pair[field] ? qa_pair[field] : accumulator.missingValue;
        if (Array.isArray(obj)) {
            const arr = obj;
            for (let j = 0; j < arr.length; j++) {
                const value = arr[j];
                if (!strict) {
                    typeValid = filteredTypes.includes(value.key);
                    if (typeValid) {
                        break;
                    }
                } else {
                    foundTypes.add(value.key)
                }

                if (firstOnly) {
                    break;
                }
            }
            if (strict && foundTypes.size === filteredTypes.length && filteredTypes.every(x => foundTypes.has(x))) {
                typeValid = true;
            }
            if (typeValid) {
                break;
            } 
        } else {
            const value = obj;
            typeValid = filteredTypes.includes(value.key);
            if (typeValid) {
                break;
            }
        }
    }
    
    const isValid = typeValid;

    if (isValid) {
        accumulator.filtered_qa_pairs.push({
            ...qa_pair
        });
    }

    return accumulator;
}

// Range Filtering
function rangeFilterReudcer_rows(accumulator, row) {
    const range = accumulator.range;

    const { filtered_qa_pairs } = row.qa_pairs.reduce(rangeFilterReudcer_qa_pairs, {
        filtered_qa_pairs: [],
        range,
        field: accumulator.field
    });

    const hasQuestions = filtered_qa_pairs.length > 0;
    const isValid = hasQuestions;

    if (isValid) {
        accumulator.filteredData.push({
            ...row,
            qa_pairs: filtered_qa_pairs,
        });
    }
    return accumulator;
}
function rangeFilterReudcer_qa_pairs(accumulator, qa_pair) {
    const range = accumulator.range;
    const field = accumulator.field;

    let rangeValid = false;
    if (qa_pair[field] !== undefined) {
        const value = qa_pair[field]
        rangeValid = value >= range.low && value <= range.high;
    } else {
        rangeValid = true;
    }    

    const isValid = rangeValid;

    if (isValid) {
        accumulator.filtered_qa_pairs.push({
            ...qa_pair
        });
    }

    return accumulator;
}

// Clipped Filtering
function clippedFilterReudcer_rows(accumulator, row) {
    const showClipped = accumulator.showClipped;
    const showUnclipped = accumulator.showUnclipped;

    const { filtered_qa_pairs } = row.qa_pairs.reduce(clippedFilterReudcer_qa_pairs, {
        filtered_qa_pairs: [],
        showClipped,
        showUnclipped,
    });

    const hasQuestions = filtered_qa_pairs.length > 0;
    const isValid = hasQuestions;

    if (isValid) {
        accumulator.filteredData.push({
            ...row,
            qa_pairs: filtered_qa_pairs,
        });
    }
    return accumulator;
}

function clippedFilterReudcer_qa_pairs(accumulator, qa_pair) {
    const showClipped = accumulator.showClipped;
    const showUnclipped = accumulator.showUnclipped;

    let isValid = false;
    if (showClipped) {
        isValid |= qa_pair.max_passage_length !== undefined;
    }
    if (showUnclipped) {
        isValid |= qa_pair.max_passage_length === undefined;
    }

    if (isValid) {
        accumulator.filtered_qa_pairs.push({
            ...qa_pair
        });
    }

    return accumulator;
}
