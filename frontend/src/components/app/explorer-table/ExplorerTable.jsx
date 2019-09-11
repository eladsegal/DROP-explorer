import React from 'react';
import ReactTable from 'react-table'
import cloneDeep from 'clone-deep'
import 'react-table/react-table.css';
import '../../../scss/highlighter.css';
import '../../../scss/react-table.css';
import WrapDiv from './WrapDiv'
import { shouldUpdate, isChanged, areSetsEqual, 
    displayIndexesToViewIndex, viewIndexToDisplayIndex, viewIndexToDisplayIndexes } from '../../Utils';
import { processDataHelper, filterDataHelper } from './DataUtils';
import Highlighter from 'react-highlight-words';
import { 
    Table 
} from 'reactstrap';

const MAX_QUESTIONS_PER_PASSAGE_ASSUMPTION = 150;

const initialInternals = {
    data: undefined,
    filteredData: undefined,
    filteredDataPerFilter: {
        answerTypes: undefined,
        predictionTypes: undefined,
        search: undefined,
        F1Range: undefined,
        EMRange: undefined,
        truncated: undefined
    },
    predictionTypes: [],

    hasValidatedAnswers: false,
    hasValidPredictions: false,
    metrics: undefined
}

const initialState = {
    page: 0,
    passagesPageSize: 5,
    questionsPageSize: MAX_QUESTIONS_PER_PASSAGE_ASSUMPTION,
    expanded_passage_ids: [],
    activeQuestions: {},
    questionResized: [],
    questionSorted: []
};

const filterProps = ['filteredAnswerTypes', 'answerTypeFilterFirstOnly', 'answerTypeFilterStrict',
                    'truncatedFilter', 'untruncatedFilter',
                    'filteredPredictionTypes', 'searchProps', 'F1Range', 'EMRange']
const props_updateSignals = ['dataset', 'predictions', ...filterProps]
const state_updateSignals = ['page', 'passagesPageSize', 'questionsPageSize', 'expanded_passage_ids', 'activeQuestions', 'questionResized', 'questionSorted']
class ExplorerTable extends React.Component {
    constructor(props) {
        super(props);

        renderPassageOrQuestionCell = renderPassageOrQuestionCell.bind(this);
        renderPredictionCell = renderPredictionCell.bind(this);
        renderAnswersCell = renderAnswersCell.bind(this);
        activeQuestionChange = activeQuestionChange.bind(this);

        this.clearSelectedAnswers = this.clearSelectedAnswers.bind(this);
        this.expandAll = this.expandAll.bind(this);
        this.collapseAll = this.collapseAll.bind(this);
        this.expandedChange = this.expandedChange.bind(this);
        this.getExpanded = this.getExpanded.bind(this);
        this.questionResizedChange = this.questionResizedChange.bind(this);

        this.processData = this.processData.bind(this);
        this.filterData = this.filterData.bind(this);
        this.getSortedData = this.getSortedData.bind(this);

        this.pageChanged = this.pageChanged.bind(this);
        this.passagesPageSizeChanged = this.passagesPageSizeChanged.bind(this);
        this.questionsPageSizeChanged = this.questionsPageSizeChanged.bind(this);
        this.passageSortedChange = this.passageSortedChange.bind(this);
        this.questionSortedChange = this.questionSortedChange.bind(this);

        this.setInternals = this.setInternals.bind(this);
        this.internals = cloneDeep(initialInternals);
        this.state = cloneDeep(initialState);

        this.tableRef = React.createRef();
    }

    setInternals(newInternals) {
        Object.assign(this.internals, newInternals)
    }

    componentDidMount() {
        this.props.sendClearSelectedAnswersFunc(this.clearSelectedAnswers);
        this.props.sendExpandAllFunc(this.expandAll);
        this.props.sendCollapseAllFunc(this.collapseAll);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (isChanged(['dataset'], this.props, nextProps)) {
            // reset all when the dataset is switched
            this.setInternals(cloneDeep(initialInternals));
            this.setState(cloneDeep(initialState));
        } else if (isChanged(['predictions'], this.props, nextProps)) {
             this.setInternals(cloneDeep(initialInternals));
        } else if (isChanged(filterProps, this.props, nextProps)) {
            // update only the changed filter
            const filteredAnswerTypesChanged = isChanged(['filteredAnswerTypes', 'answerTypeFilterFirstOnly', 'answerTypeFilterStrict'], this.props, nextProps);
            const filteredPredictionTypesChanged = isChanged(['filteredPredictionTypes'], this.props, nextProps);
            const searchPropsChanged = isChanged(['searchProps'], this.props, nextProps);
            const F1RangeChanged = isChanged(['F1Range'], this.props, nextProps);
            const EMRangeChanged = isChanged(['EMRange'], this.props, nextProps);
            const truncatedFilterChanged = isChanged(['truncatedFilter', 'untruncatedFilter'], this.props, nextProps);

            const refilteringRequired = filteredAnswerTypesChanged || filteredPredictionTypesChanged || 
                                    searchPropsChanged || F1RangeChanged || EMRangeChanged || truncatedFilterChanged;

            this.setInternals({
                filteredData: refilteringRequired ? undefined : this.internals.filteredData
            });
            if (filteredAnswerTypesChanged) {
                this.internals.filteredDataPerFilter.answerTypes = undefined;
            }
            if (filteredPredictionTypesChanged) {
                this.internals.filteredDataPerFilter.predictionTypes = undefined;
            }
            if (searchPropsChanged) {
                this.internals.filteredDataPerFilter.search = undefined;
            }
            if (F1RangeChanged) {
                this.internals.filteredDataPerFilter.F1Range = undefined;
            }
            if (EMRangeChanged) {
                this.internals.filteredDataPerFilter.EMRange = undefined;
            }
            if (truncatedFilterChanged) {
                this.internals.filteredDataPerFilter.truncated = undefined;
            }
        }
        
        const update = shouldUpdate(props_updateSignals, state_updateSignals, 
            this.props, this.state, 
            nextProps, nextState, 
            false, this.constructor.name);
        return update;
    }

    componentDidUpdate(prevProps, prevState) {
        if (isChanged(['dataset', 'predictions'], prevProps, this.props)) {
            this.props.onPredictionsTypeChanged(this.internals.predictionTypes);
        }
        if (isChanged(filterProps, prevProps, this.props)) {
            // force updated is needed for getExpanded() to be called again,
            // so it will use the filtered sorted data to find the expanded rows
            this.forceUpdate(() => {
                this.setState({ page: 0 });
            })
        }
    }

    pageChanged(page) {
        this.setState({ page });
    }

    passagesPageSizeChanged(pageSize, page) {
        this.setState({ passagesPageSize: pageSize, page });
    }

    questionsPageSizeChanged(pageSize, page) {
        this.setState({ questionsPageSize: pageSize, page });
    }

    passageSortedChange(newSorted, column, additive) {
        // force updated is needed for getExpanded() to be called,
        // so it will use the filtered sorted data to find the expanded rows
        this.forceUpdate();
    }

    questionSortedChange(newSorted, column, additive) {
        this.setState({
            questionSorted: newSorted
        });
    }

    expandedChange(newExpanded, index, event) {
        const pageSize = this.state.passagesPageSize;
        const page = this.state.page;

        const viewIndex = index[0];
        const displayIndex = viewIndexToDisplayIndex(viewIndex, page, pageSize);

        const sortedData = this.getSortedData();
        const passage_id = sortedData[displayIndex].passage_id; 
        
        const matchingPosition = this.state.expanded_passage_ids.indexOf(passage_id);
        if (matchingPosition === -1) {
            this.setState({
                expanded_passage_ids: [...this.state.expanded_passage_ids, passage_id]
            });
        } else {
            const expanded_passage_ids = [...this.state.expanded_passage_ids];
            expanded_passage_ids.splice(matchingPosition, 1);
            this.setState({
                expanded_passage_ids
            });
        }
    }

    expandAll() {
        this.setState({
            expanded_passage_ids: [...this.internals.filteredData.map(row => row.passage_id)]
        });
    }

    collapseAll() {
        this.setState({
            expanded_passage_ids: []
        });
    }

    getExpanded() {
        const defaultExpanded = {};
        if (!this.tableRef.current) {
            return defaultExpanded;
        }

        const sortedData = this.getSortedData();

        const indexesFromSorted = new Set(sortedData.map(row => row.passage_index))
        const indexesFromFiltered = new Set(this.internals.filteredData.map(row => row.passage_index))
        if (!areSetsEqual(indexesFromSorted, indexesFromFiltered)) {
            return defaultExpanded;
        }

        const pageSize = this.state.passagesPageSize;
        const page = this.state.page;

        const viewIndexes = [...Array(pageSize).keys()];
        const displayIndexsInPage = viewIndexToDisplayIndexes(viewIndexes, page, pageSize);

        const expandedDisplayIndexes = displayIndexsInPage.filter(displayIndex => {
            if (displayIndex < sortedData.length) {
                const passage_id = sortedData[displayIndex].passage_id;
                return this.state.expanded_passage_ids.includes(passage_id)
            }
            return false;
        });

        let expandedInPage = displayIndexesToViewIndex(expandedDisplayIndexes, page, pageSize, true);

        return expandedInPage;
    }

    questionResizedChange(newResized, event) {
        this.setState({
            questionResized: newResized
        });
    }

    clearSelectedAnswers() {
        this.setState({
            activeQuestions: {}
        });
    }

    processData() {
        const dataset = this.props.dataset;
        const predictions = this.props.predictions;

        const {
            data, 
            hasValidatedAnswers,
            hasValidPredictions,
            predictionTypes
        } = processDataHelper(dataset, predictions);

        this.setInternals({
            data,
            hasValidatedAnswers,
            hasValidPredictions,
            predictionTypes
        });
    }

    filterData() {
        const filteredAnswerTypes = this.props.filteredAnswerTypes;
        const answerTypeFilterFirstOnly = this.props.answerTypeFilterFirstOnly;
        const answerTypeFilterStrict = this.props.answerTypeFilterStrict;
        const filteredPredictionTypes = this.props.filteredPredictionTypes;
        const searchProps = this.props.searchProps;
        const F1Range = this.props.F1Range;
        const EMRange = this.props.EMRange;
        const truncatedFilter = {'showTruncated': this.props.truncatedFilter, 'showUntruncated': this.props.untruncatedFilter};

        const {
            filteredData,
            filteredDataPerFilter,
            metrics
        } = filterDataHelper(this.internals, filteredAnswerTypes, answerTypeFilterFirstOnly, answerTypeFilterStrict, 
                            filteredPredictionTypes, searchProps, F1Range, EMRange, truncatedFilter);
        
        this.setInternals({
            filteredData,
            filteredDataPerFilter,
            metrics
        });
    }

    getSortedData() {
        return this.tableRef.current.getResolvedState().sortedData;
    }

    render() {

        if (!this.internals.data) {
            this.processData();
        }
        
        if (!this.internals.filteredData) {
            this.filterData();
        }        

        const passage_columns = [
            {
                Header: '#',
                id: 'passage_index',
                accessor: 'passage_index',
                width: 50
            },
            {
                Header: 'Passage ID',
                accessor: 'passage_id',
                width: 110
            }, 
            {
                Header: 'Passage',
                accessor: 'passage',
                Cell: renderPassageOrQuestionCell
            }, 
            {
                Header: 'Count',
                id: 'questions_count',
                accessor: row => row.qa_pairs.length,
                width: 50,
                resizable: false
            },
            {
                Header: 'F1',
                id: 'f1',
                show: this.internals.hasValidPredictions,
                accessor: qa_pair => fixDecimalPlaces(qa_pair.f1, 4),
                width: 50,
                resizable: false
            }, {
                Header: 'EM',
                id: 'em',
                show: this.internals.hasValidPredictions,
                accessor: qa_pair => fixDecimalPlaces(qa_pair.em, 4),
                width: 50,
                resizable: false
            }
        ]

        const qa_columns = [
            {
                Header: '#',
                accessor: 'query_index',
                width: 40
            },
            {
                Header: 'Question ID',
                accessor: 'query_id',
                width: 100
            },
            {
                Header: 'Question',
                accessor: 'question',
                Cell: renderPassageOrQuestionCell
            },
            {
                Header: 'Answer Options',
                accessor: 'displayAnswers',
                Cell: renderAnswersCell,
                width: 150
            },
            {
                Header: '→ Type',
                id: 'answersTypes',
                accessor: qa_pair => qa_pair.answersTypes,
                Cell: renderAnswersTypesCell,
                width: 100,
                resizable: false
            },
            {
                Header: 'Prediction',
                show: this.internals.hasValidPredictions,
                accessor: 'displayPrediction',
                Cell: renderPredictionCell,
                width: 150
            },
            {
                Header: 'Prediction Head',
                id: 'predictionType',
                show: this.internals.hasValidPredictions,
                accessor: qa_pair => qa_pair.predictionType ? qa_pair.predictionType.value : '',
                width: 110
            },
            {
                Header: 'F1',
                id: 'f1',
                show: this.internals.hasValidPredictions,
                accessor: qa_pair => fixDecimalPlaces(qa_pair.f1, 4),
                width: 50,
                resizable: false
            }, {
                Header: 'EM',
                id: 'em',
                show: this.internals.hasValidPredictions,
                accessor: qa_pair => fixDecimalPlaces(qa_pair.em, 4),
                width: 50,
                resizable: false
            }
        ]

        return <div className='container-fluid'>
            <div className='row justify-content-center'>
                <div className='col-3'>
                    <h4>
                    Passage Count: {this.internals.filteredData.length.toLocaleString()}
                    </h4>
                </div>
                <div className='col-3'>
                    <h4>
                        Questions Count: {this.internals.metrics.questionsCount.toLocaleString()}
                    </h4>
                </div>
                {this.props.predictions ? <div className='col-3'>
                    <h4>
                        {this.internals.hasValidPredictions ?
                        `Predictions Count: ${this.internals.metrics.predictedCount.toLocaleString()}` :
                        'Predictions do not match the dataset'
                        }
                    </h4>
                </div> : null}
                {(this.props.predictions && this.internals.hasValidPredictions) ? <div className='col-3'>
                    <h4>
                        F1: {fixDecimalPlaces(this.internals.metrics.f1, 4)}, EM: {fixDecimalPlaces(this.internals.metrics.em, 4)}
                    </h4>
                </div> : null}
            </div>
            <div className='row'><div className='col-12'>
                <ReactTable ref={this.tableRef} className="-striped-passage -highlight-passage"
                data={this.internals.filteredData} 
                columns={passage_columns}
                minRows={0}
                showPaginationTop={true}
                showPaginationBottom={true}
                page={this.state.page}
                pageSize={this.state.passagesPageSize}
                pageSizeOptions={[1, 5, 10, 20, 25, 50, 100]}
                onPageChange={this.pageChanged}
                onPageSizeChange={this.passagesPageSizeChanged}
                collapseOnSortingChange={false}
                collapseOnPageChange={false}
                collapseOnDataChange={false}
                onSortedChange={this.passageSortedChange}
                expanded={this.getExpanded()}
                onExpandedChange={(newExpanded, index, event) => this.expandedChange(newExpanded, index, event)}
                SubComponent={row => {
                    const qa_pairs = row.original.qa_pairs
                    return (
                        <ReactTable className="-striped-question -highlight-question" style={{maxHeight: '400px'}}
                        data={qa_pairs}
                        columns={qa_columns}
                        minRows={0}
                        sorted={this.state.questionSorted}
                        onSortedChange={this.questionSortedChange}
                        resized={this.state.questionResized}
                        onResizedChange={this.questionResizedChange}
                        pageSize={this.state.questionsPageSize}
                        pageSizeOptions={[1, 5, 10, 20, 25, MAX_QUESTIONS_PER_PASSAGE_ASSUMPTION]}
                        onPageSizeChange={this.questionsPageSizeChanged}
                        showPagination={false}
                        getTrProps={(state, rowInfo, column, instance) => {
                            return {
                                onClick: (e, handleOriginal) => {
                                    activeQuestionChange(rowInfo, e);

                                    if (handleOriginal) {
                                        handleOriginal();
                                    }
                                }
                            }
                        }}
                        />
                    )
                }}
                />
            </div></div>
            </div>
    }
}

let renderPassageOrQuestionCell = function(props) {
    let searchWords = [];
    let categoryPerSearchWordIndex = undefined;
    let spans = [];
    let categoryPerSpanIndex = [];
    let highlightClassNamePerCategory = undefined;
    const activeQuestionId = this.state.activeQuestions[props.original.passage_id];
    if (activeQuestionId) {
        let qa_pair;
        if (props.column.id === 'passage') {
            qa_pair = props.original.qa_pairs
                        .find(qa_pair => qa_pair.query_id === activeQuestionId);
        } else {
            if (activeQuestionId === props.original.query_id) {
                qa_pair = props.original;
            }
        }
        if (qa_pair) {
            searchWords = [...qa_pair.evaluationAnswers[qa_pair.maximizingGroundTruthIndex]];

            categoryPerSearchWordIndex = searchWords.map(() => 'gold_1')
            highlightClassNamePerCategory = {'gold_1': 'highlight-gold'}

            if (qa_pair.prediction) {
                if (qa_pair.predictionType.key === 'arithmetic') {
                    searchWords = [];
                    categoryPerSearchWordIndex = [];
                    highlightClassNamePerCategory = {};
                }

                const context = props.column.id === 'passage' ? 'p' : 'q'

                highlightClassNamePerCategory['truncated_0'] = 'truncated-passage'
                const max_passage_length = qa_pair.max_passage_length;
                if (max_passage_length !== undefined && context === 'p') {
                    spans.push([max_passage_length, props.original.passage.length]);
                    categoryPerSpanIndex.push('truncated_0');
                }
                
                if (!['counting'].includes(qa_pair.predictionType.key)) {
                    const predictionSpans = qa_pair.predictionSpans;
                    if (predictionSpans) {
                        predictionSpans.reduce((spansAcc, span) => {
                            if (span[0] === context) {
                                spansAcc.push([span[1], span[2]]);
                            }
                            return spansAcc;
                        }, spans)
                        spans.forEach(() => categoryPerSpanIndex.push('focus_3'))
                    }

                    const evaluationPrediction = qa_pair.evaluationPrediction;
                    if (evaluationPrediction) {
                        searchWords.push(...evaluationPrediction);
                        categoryPerSearchWordIndex.push(...(evaluationPrediction.map(x => 'prediction_2')));
                    }

                    highlightClassNamePerCategory['prediction_2'] = 'highlight-predicted';
                    highlightClassNamePerCategory['prediction_2-focus_3'] = 'highlight-predicted-focus';
                    highlightClassNamePerCategory['truncated_0-prediction_2-focus_3'] = 'highlight-predicted-focus-truncated';
                    highlightClassNamePerCategory['gold_1-prediction_2'] = 'highlight-correct';
                    highlightClassNamePerCategory['truncated_0-gold_1-prediction_2'] = 'highlight-correct-truncated';
                    highlightClassNamePerCategory['gold_1-prediction_2-focus_3'] = 'highlight-correct-focus';
                    highlightClassNamePerCategory['truncated_0-gold_1-prediction_2-focus_3'] = 'highlight-correct-focus-truncated';
                } else {
                    searchWords = [];
                }
            }
        }
    }
    return <WrapDiv><Highlighter autoEscape={true}
            searchWords={searchWords} categoryPerSearchWordIndex={categoryPerSearchWordIndex}
            spans={spans} categoryPerSpanIndex={categoryPerSpanIndex}
            highlightClassNamePerCategory={highlightClassNamePerCategory}
            textToHighlight={props.value} paddingMultiplier={0} /></WrapDiv>
}
let renderPredictionCell = function(props) {
    let searchWords = [];
    const highlightClassName = 'highlight-predicted-regular';
    const qa_pair = props.original;
    const activeQuestionId = this.state.activeQuestions[qa_pair.passage_id];
    if (activeQuestionId === qa_pair.query_id) {
        if (qa_pair.prediction) {
            searchWords = qa_pair.evaluationPrediction;
        }
    }
    return <WrapDiv><Highlighter autoEscape={true} highlightClassName={highlightClassName} searchWords={searchWords} textToHighlight={props.value || ''} /></WrapDiv>
}
let renderAnswersCell = function(props) {
    let searchWords = [];
    const highlightClassName = 'highlight-gold';
    const activeQuestionId = this.state.activeQuestions[props.original.passage_id];
    if (activeQuestionId === props.original.query_id) {        
        searchWords = props.original.evaluationAnswers[props.original.maximizingGroundTruthIndex];
    }
    return <Table style={{height: '100%'}} striped>
        <tbody>
            {props.value.map((answer, index) => {
                return <tr key={index}>
                    <td style={{whiteSpace: 'pre-wrap', padding: 0, 'borderTop': 0}}>
                        <WrapDiv><Highlighter autoEscape={true} highlightClassName={highlightClassName} 
                            searchWords={props.original.maximizingGroundTruthIndex === index ? searchWords : []} 
                            textToHighlight={answer} /></WrapDiv>
                    </td>
                </tr>
            })}
        </tbody>
    </Table>
}
let renderAnswersTypesCell = function(props) {
    return <Table style={{height: '100%'}} striped>
        <tbody>
            {props.value.map((answerType, index) => 
                <tr key={index}>
                    <td style={{whiteSpace: 'pre-wrap', padding: 0, 'borderTop': 0}}>
                        {answerType.value}
                    </td>
                </tr>
            )}
        </tbody>
    </Table>
}

let activeQuestionChange = function(rowInfo, e) {
    const passage_id = rowInfo.original.passage_id
    const query_id = rowInfo.original.query_id

    if (this.state.activeQuestions[passage_id] === query_id) {
        const activeQuestions = {...this.state.activeQuestions};
        delete activeQuestions[passage_id]
        this.setState({
            activeQuestions
        });
    } else {
        this.setState({
            activeQuestions: {
                //...this.state.activeQuestions, // controls whether to allow selection of multiple questions accross different paragrahps
                [passage_id]: query_id
            }
        });
    }
}

function fixDecimalPlaces(num, places, convertToPercentage) {
    if (convertToPercentage) {
        num *= 100
    }
    return num !== undefined ? parseFloat((Math.round((num) * Math.pow(10, places)) / Math.pow(10, places)).toFixed(places)) : undefined;
}

export default ExplorerTable;
