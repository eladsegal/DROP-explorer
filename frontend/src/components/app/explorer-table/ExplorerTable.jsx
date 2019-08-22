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
import { getAnswerField, getAnswerForDisplay, 
    answerAccessor, answerTypeAccessor, 
    predictionAccessor, predictionTypeAccessor } from '../AnswersUtils';
import Highlighter from 'react-highlight-words';
import { 
    Table 
} from 'reactstrap';

const MAX_QUESTIONS_PER_PASSAGE_ASSUMPTION = 150;

const initialInternals = {
    data: undefined,
    filteredData: undefined,
    sortedData: undefined,
    filteredDataPerFilter: {
        answerTypes: undefined,
        predictionTypes: undefined,
        search: undefined
    },

    hasValidatedAnswers: false,
    hasValidPredictions: false,
}

const initialState = {
    page: 0,
    passagesPageSize: 20,
    questionsPageSize: MAX_QUESTIONS_PER_PASSAGE_ASSUMPTION,
    expanded_passage_ids: [],
    activeQuestions: {},
    questionResized: [],
    questionSorted: []
};

const filterProps = ['filteredAnswerTypes', 'filteredPredictionTypes', 'searchProps']
const props_updateSignals = ['dataset', 'predictions', ...filterProps]
const state_updateSignals = ['page', 'passagesPageSize', 'questionsPageSize', 'expanded_passage_ids', 'activeQuestions', 'questionResized', 'questionSorted']
class ExplorerTable extends React.Component {
    constructor(props) {
        super(props);

        renderPassageCell = renderPassageCell.bind(this);
        renderHighlightableQuestionCell = renderHighlightableQuestionCell.bind(this);
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
        if (this.props.dataset !== nextProps.dataset) {
            // reset all when the dataset is switched
            this.setInternals(cloneDeep(initialInternals));
            this.setState(cloneDeep(initialState));
        } else if (this.props.predictions !== nextProps.predictions) {
             this.setInternals({data: undefined, filteredData: undefined});
        } else if (isChanged(filterProps, this.props, nextProps)) {
            // update only the changed filter
            const filteredAnswerTypesChanged = this.props.filteredAnswerTypes !== nextProps.filteredAnswerTypes;
            const filteredPredictionTypesChanged = this.props.filteredPredictionTypes !== nextProps.filteredPredictionTypes;
            const searchPropsChanged = this.props.searchProps !== nextProps.searchProps;
            const refilteringRequired = filteredAnswerTypesChanged || filteredPredictionTypesChanged || searchPropsChanged;

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
        }
        
        const update = shouldUpdate(props_updateSignals, state_updateSignals, 
            this.props, this.state, 
            nextProps, nextState, 
            true, this.constructor.name);
        return update;
    }

    componentDidUpdate(prevProps, prevState) {
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
            hasValidPredictions
        } = processDataHelper(dataset, predictions);

        this.setInternals({
            data,
            hasValidatedAnswers,
            hasValidPredictions
        })
    }

    filterData() {
        const filteredAnswerTypes = this.props.filteredAnswerTypes;
        const filteredPredictionTypes = this.props.filteredPredictionTypes;
        const searchProps = this.props.searchProps;

        const {
            filteredData,
            filteredDataPerFilter
        } = filterDataHelper(this.internals, filteredAnswerTypes, filteredPredictionTypes, searchProps);
        
        this.setInternals({
            filteredData,
            filteredDataPerFilter
        })
    }

    getSortedData() {
        return this.tableRef.current.getResolvedState().sortedData;
    }

    render() {

        console.time('processData');
        if (!this.internals.data) {
            this.processData();
        }
        console.timeEnd('processData');
        
        console.time('filterData');
        if (!this.internals.filteredData) {
            this.filterData();
        }        
        console.timeEnd('filterData');

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
                Cell: renderPassageCell
            }, 
            {
                Header: 'Count',
                id: 'questions_count',
                accessor: row => row.qa_pairs.length,
                width: 50
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
                Cell: renderHighlightableQuestionCell
            },
            {
                Header: 'Answer',
                id: 'answer',
                accessor: answerAccessor,
                Cell: renderHighlightableQuestionCell,
                width: 150
            },
            {
                Header: 'Answer Type',
                id: 'answerType',
                accessor: answerTypeAccessor,
                width: 110
            },
            {
                Header: 'Additional Distinct Answers',
                id: 'additional_answers',
                show: this.internals.hasValidatedAnswers,
                accessor: qa_pair => {
                    if (!qa_pair.validated_answers || qa_pair.validated_answers.length === 0) {
                        return null;
                    }
                    
                    const main_answer = answerAccessor(qa_pair);
                    const answers = [];
                    qa_pair.validated_answers.forEach((answerDict, index) => {
                        const answerField = getAnswerField(answerDict);
                        if (answerField) {
                            const answer = getAnswerForDisplay(answerDict[answerField.key]).toString();
                            if (answer !== main_answer && !answers.includes(answer)) {
                                answers.push(answer);
                            }
                        }
                    });
                    return answers;
                },
                Cell: props => <Table striped><tbody>{props.value.map((answer, index) => 
                    <tr key={index}><td style={{'whiteSpace': 'pre-wrap', padding: 0, 'borderTop': 0}}>{answer}</td></tr>
                )}</tbody></Table>,
                width: 170
            },            
            {
                Header: 'Prediction',
                id: 'prediction',
                show: this.internals.hasValidPredictions,
                accessor: predictionAccessor,
                Cell: renderHighlightableQuestionCell,
                width: 150
            },
            {
                Header: 'Prediction Type',
                id: 'predictionType',
                show: this.internals.hasValidPredictions,
                accessor: predictionTypeAccessor,
                width: 110
            },
        ]


        let questionsCount = 0;
        let predictedCount = 0;
        for (let i=0; i < this.internals.filteredData.length; i++) {
            const row = this.internals.filteredData[i];

            questionsCount += row.qa_pairs.length;

            if (this.internals.hasValidPredictions) {
                for (let j=0; j < row.qa_pairs.length; j++) {
                    const qa_pair = row.qa_pairs[j];
        
                    if (qa_pair.prediction) {
                        predictedCount += 1;
                    }
                }
            }
        }

        return <div className='container-fluid'>
            <div className='row justify-content-center'>
                <div className='col-3'>
                    <h4>
                    Passage Count: {this.internals.filteredData.length.toLocaleString()}
                    </h4>
                </div>
                <div className='col-3'>
                    <h4>
                        Questions Count: {questionsCount.toLocaleString()}
                    </h4>
                </div>
                {this.props.predictions ? <div className='col-3'>
                    <h4>
                        {this.internals.hasValidPredictions ?
                        `Predictions Count: ${predictedCount.toLocaleString()}` :
                        'Predictions do not match the dataset'
                        }
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
                        <ReactTable className="-striped-question -highlight-question"
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

let renderPassageCell = function(props) {
    let searchWords = [];
    let categoryPerSearchWordIndex = undefined;
    let highlightClassNamePerCategory = undefined;
    const activeQuestionId = this.state.activeQuestions[props.original.passage_id];
    if (activeQuestionId) {
        const qa_pair = props.original.qa_pairs
                        .find(qa_pair => qa_pair.query_id === activeQuestionId);
        const selectedAnswer = qa_pair.answer;
        // TODO: Would be best to use the best aligned answer including the additional answers.

        const answerType = getAnswerField(selectedAnswer)
        searchWords = (answerType.key === 'number') ? 
            [Number(selectedAnswer.number).toString()] : [...selectedAnswer.spans]

        categoryPerSearchWordIndex = searchWords.map(searchWord => 'gold_0')
        highlightClassNamePerCategory = {'gold_0': 'highlight-gold'}

        const prediction = qa_pair.prediction;
        if (prediction) {
            searchWords.push(...prediction);
            categoryPerSearchWordIndex.push(...prediction.map(x => 'prediction_1'));
            highlightClassNamePerCategory['prediction_1'] = 'highlight-predicted';
            highlightClassNamePerCategory['gold_0-prediction_1'] = 'highlight-correct'
        }
    }
    return <WrapDiv><Highlighter 
            searchWords={searchWords} categoryPerSearchWordIndex={categoryPerSearchWordIndex} 
            highlightClassNamePerCategory={highlightClassNamePerCategory}
            textToHighlight={props.value} /></WrapDiv>
}
let renderHighlightableQuestionCell = function(props) {
    let searchWords = [];
    const highlightClassName = props.column.id === 'prediction' ? 'highlight-predicted' : 'highlight-gold';
    const activeQuestionId = this.state.activeQuestions[props.original.passage_id];
    if (activeQuestionId === props.original.query_id) {        
        if (props.column.id === 'prediction') {
            searchWords = props.original.prediction ? props.original.prediction : [];
        } else {
            const selectedAnswer = props.original.answer;
            const answerType = getAnswerField(selectedAnswer)
            searchWords = (answerType.key === 'number') ? 
                [Number(selectedAnswer.number).toString()] : selectedAnswer.spans
        }
    }
    return <WrapDiv><Highlighter highlightClassName={highlightClassName} searchWords={searchWords} textToHighlight={props.value} /></WrapDiv>
}

let activeQuestionChange = function(rowInfo, e) {
    const answerDict = rowInfo.original.answer;
    const answerType = getAnswerField(answerDict)
    if (answerType && answerType.key !== 'date') {

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
                    //...this.state.activeQuestions, 
                    [passage_id]: query_id
                }
            });
        }
    }
}

export default ExplorerTable;
