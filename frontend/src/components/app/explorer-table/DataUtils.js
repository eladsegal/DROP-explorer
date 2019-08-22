import { answerTypes, getAnswerType, 
    answerAccessor, predictionAccessor, nonAnswerType } from '../AnswersUtils';
import { intersect } from '../../Utils';

export function processDataHelper(dataset, predictions) {

    let hasValidatedAnswers = false;
    let hasValidPredictions = false;
    let passage_id_to_displayIndex = {};
    let passage_id_to_queries_displayIndexes = {};

    let data;
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
            hasValidPredictions = true;
            for (let i=0; i < predictions.length; i++) {
                const prediction = predictions[i];

                const passage_id = prediction.passage_id;
                const query_id = prediction.query_id;

                const passage_displayIndex =passage_id_to_displayIndex[passage_id];
                if (passage_displayIndex !== undefined) {
                    const row = data[passage_displayIndex];

                    const query_displayIndex = passage_id_to_queries_displayIndexes[passage_id][query_id];
                    if (query_displayIndex !== undefined) {
                        const qa_pair = row.qa_pairs[passage_id_to_queries_displayIndexes[passage_id][query_id]]

                        qa_pair.prediction = prediction.answer;
                        if (qa_pair.loss) {
                            qa_pair.loss = prediction.loss;
                        }
                        if (qa_pair.f1) {
                            qa_pair.f1 = prediction.f1;
                        }
                    } else {
                        hasValidPredictions = false;
                        break;
                    }
                }
                else {
                    hasValidPredictions = false;
                    break;
                }
            }
        }
    } else {
        data = []
    }

    return {
        data,
        hasValidatedAnswers,
        hasValidPredictions
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

    if (getAnswerType(qa_pair.answer) !== nonAnswerType) {
        accumulator.qa_pairs.push({
            ...qa_pair,
            query_index,
            passage_id
        })
        accumulator.query_id_to_displayIndex[qa_pair.query_id] = query_displayIndex;
    }

    return accumulator;
}


export function filterDataHelper(internals, filteredAnswerTypes, filteredPredictionTypes, searchProps) {

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
            if (filteredAnswerTypes.length < answerTypes.length) {
                const reduced = data.reduce(answerTypeFilterReudcer_rows, {
                    filteredData: [],
                    filteredAnswerTypes,
                    answerField: 'answer'
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
            const reduced = data.reduce(answerTypeFilterReudcer_rows, {
                filteredData: [],
                filteredAnswerTypes: filteredPredictionTypes,
                answerField: 'prediction'
            });
            const result = reduced.filteredData;

            filteredDataPerFilter.predictionTypes = result;
        } else {
            filteredDataPerFilter.predictionTypes = [];
        }
    }

    let filteredData = intersectFilteredData(filteredDataPerFilter, data.length);

    if (!filteredData) {
        filteredData = data;
    }

    return {
        filteredData,
        filteredDataPerFilter
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

    const displayedAnswer = answerAccessor(qa_pair);
    result = (displayedAnswer && displayedAnswer.toLowerCase().includes(searchText));

    if (result) {
        return true;
    }

    if (hasValidPredictions) {
        const displayedPrediction = predictionAccessor(qa_pair);
        result = (displayedPrediction && displayedPrediction.toLowerCase().includes(searchText));    
    }

    return result;
}

// Answer Type Filtering
function answerTypeFilterReudcer_rows(accumulator, row) {
    const filteredAnswerTypes = accumulator.filteredAnswerTypes;

    const { filtered_qa_pairs } = row.qa_pairs.reduce(answerTypeFilterReudcer_qa_pairs, {
        filtered_qa_pairs: [],
        filteredAnswerTypes,
        answerField: accumulator.answerField
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
function answerTypeFilterReudcer_qa_pairs(accumulator, qa_pair) {
    const filteredAnswerTypes = accumulator.filteredAnswerTypes;

    const answerTypeValid = filterByAnswerType_qa_pair(qa_pair, filteredAnswerTypes, accumulator.answerField);
    const isValid = answerTypeValid;

    if (isValid) {
        accumulator.filtered_qa_pairs.push({
            ...qa_pair
        });
    }

    return accumulator;
}
function filterByAnswerType_qa_pair(qa_pair, filteredAnswerTypes, answerField) {
    let answerType;
    if (answerField === 'prediction') {
        const prediction = qa_pair.prediction;
        answerType = prediction ? getAnswerType({'spans': qa_pair.prediction}) : nonAnswerType.key;
    } else {
        answerType = getAnswerType(qa_pair[answerField]);
    }

    if (filteredAnswerTypes.includes(answerType)) {
        return true;
    }
    return false;
}
