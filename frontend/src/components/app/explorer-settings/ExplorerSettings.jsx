import React from 'react';
import DatasetLoader from './dataset-loader/DatasetLoader';
import PredictionsLoader from './PredictionsLoader';
import {
    ListGroup,
    ListGroupItem,
    CardGroup,
    Card,
    CardHeader,
    CardBody,
    Button,
    Container
} from 'reactstrap';
import { shouldUpdate, isChanged } from '../../Utils';
import { answerTypesConst } from '../AnswersUtils';
import SearchFilter from './SearchFilter';
import CheckboxList from '../../checkbox_list/CheckboxList';
import RangeInput from '../../range_input/RangeInput';
import Checkbox from '../../checkbox/Checkbox';

const props_updateSignals = ['predictionTypes']
const state_updateSignals = ['dataset', 'predictions', 'filteredAnswerTypes', 'answerTypeFilterFirstOnly', 
                            'answerTypeFilterStrict', 'clippedFilter', 'unclippedFilter',
                            'filteredPredictionTypes', 'searchProps', 'F1Range', 'EMRange']
class ExplorerSettings extends React.Component {
    constructor(props) {
        super(props);
        this.datasetChange = this.datasetChange.bind(this);
        this.predictionsChange = this.predictionsChange.bind(this);
        this.filteredAnswerTypesChange = this.filteredAnswerTypesChange.bind(this);
        this.answerTypeFilterFirstOnlyChange = this.answerTypeFilterFirstOnlyChange.bind(this);
        this.answerTypeFilterStrictChange = this.answerTypeFilterStrictChange.bind(this);
        this.clippedFilterChange = this.clippedFilterChange.bind(this);
        this.unclippedFilterChange = this.unclippedFilterChange.bind(this);
        this.filteredPredictionTypesChange = this.filteredPredictionTypesChange.bind(this);
        this.searchFilterChange = this.searchFilterChange.bind(this);
        this.rangeFilterChange = this.rangeFilterChange.bind(this);
        this.state = {
            filteredAnswerTypes: this.props.filteredAnswerTypes,
            answerTypeFilterFirstOnly: this.props.answerTypeFilterFirstOnly,
            answerTypeFilterStrict: this.props.answerTypeFilterStrict,
            clippedFilter: this.props.clippedFilter,
            unclippedFilter: this.props.unclippedFilter,
            filteredPredictionTypes: this.props.filteredPredictionTypes,
            searchProps: this.props.searchProps,
            F1Range: this.props.F1Range,
            EMRange: this.props.EMRange
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const update = shouldUpdate(props_updateSignals, state_updateSignals, 
            this.props, this.state, 
            nextProps, nextState, 
            false, this.constructor.name);
        return update;
    }

    componentDidUpdate(prevProps, prevState) {
        if (isChanged(['predictionTypes'], prevProps, this.props)) {
            this.setState({ filteredPredictionTypes: this.props.predictionTypes.map(predictionType => predictionType.key) });
        }
        this.props.onChange(this.state);
    }

    datasetChange(dataset) {
        this.setState({ dataset });
    }

    predictionsChange(predictions) {
        this.setState({ predictions });
    }

    filteredAnswerTypesChange(filteredAnswerTypes) {
        this.setState({ filteredAnswerTypes });
    }
    
    answerTypeFilterFirstOnlyChange(answerTypeFilterFirstOnly) {
        this.setState({ answerTypeFilterFirstOnly });
    }

    answerTypeFilterStrictChange(answerTypeFilterStrict) {
        this.setState({ answerTypeFilterStrict });
    }

    clippedFilterChange(clippedFilter) {
        this.setState({ clippedFilter });
    }

    unclippedFilterChange(unclippedFilter) {
        this.setState({ unclippedFilter });
    }

    filteredPredictionTypesChange(filteredPredictionTypes) {
        this.setState({ filteredPredictionTypes });
    }

    searchFilterChange(searchProps) {
        this.setState({ searchProps });
    }

    rangeFilterChange(metric, range) {
        this.setState({ [`${metric}Range`]: range });
    }

    render() {
        return <Container className='ml-0' fluid>
            <CardGroup className='row'>
                <Card className='col-sm-2 p-0'>
                    <CardHeader>Dataset</CardHeader>
                    <CardBody>
                        <DatasetLoader onDatasetChange={this.datasetChange} 
                                        useLocalDataset={this.props.useLocalDataset} 
                                        allowSourceSelection={this.props.allowSourceSelection} />
                    </CardBody>
                </Card>
                <Card className='col-sm-2 p-0'>
                    <CardHeader>Table Operations</CardHeader>
                    <CardBody style={{height: 0, overflow: 'auto'}}>
                        <ListGroup>
                            <ListGroupItem>
                                <Button color='primary' size='sm' style={{width: '100%'}} onClick={() => {
                                    if (this.props.expandAllFunc) {
                                        this.props.expandAllFunc()
                                    }
                                }}>EXPAND ALL
                                </Button>
                            </ListGroupItem>
                            <ListGroupItem>
                                <Button color='primary' size='sm' style={{width: '100%'}} onClick={() => {
                                    if (this.props.collapseAllFunc) {
                                        this.props.collapseAllFunc()
                                    }
                                }}>COLLAPSE ALL
                                </Button>
                            </ListGroupItem>
                            <ListGroupItem>
                                <Button color='primary' size='sm' style={{width: '100%'}} onClick={() => {
                                    if (this.props.clearSelectedAnswersFunc) {
                                        this.props.clearSelectedAnswersFunc()
                                    }
                                }}>CLEAR SELECTED ANSWERS
                                </Button>
                            </ListGroupItem>
                        </ListGroup>
                    </CardBody>
                </Card>
                <Card className='col-sm-2 p-0'>
                    <CardHeader>
                        Answer Type Filter
                    </CardHeader>
                    <CardBody>
                        <ListGroup className='list-group-horizontal'>
                            <ListGroupItem style={{width: '100%'}}>
                                <CheckboxList 
                                    onChange={this.filteredAnswerTypesChange} 
                                    checked={this.state.filteredAnswerTypes} 
                                    options={answerTypesConst}></CheckboxList>
                            </ListGroupItem>
                            <ListGroupItem style={{width: '100%'}}>
                                <Checkbox text={'Primary Only'} inline={false}
                                    checked={this.state.answerTypeFilterFirstOnly}
                                    onChange={this.answerTypeFilterFirstOnlyChange}></Checkbox>
                                <Checkbox text={'Strict'} inline={false}
                                    checked={this.state.answerTypeFilterStrict}
                                    onChange={this.answerTypeFilterStrictChange}></Checkbox>
                            </ListGroupItem>
                        </ListGroup>
                    </CardBody>
                </Card>
                <Card className='col-sm-6 p-0'>
                    <CardHeader>Search</CardHeader>
                    <CardBody>
                        <SearchFilter onChange={this.searchFilterChange} 
                        instantSearch={this.props.instantSearch} searchProps={this.props.searchProps} />
                    </CardBody>
                </Card>
            </CardGroup>
            <CardGroup className='row'>
                <Card className='col-sm-2 p-0'>
                        <CardHeader>Predictions</CardHeader>
                        <CardBody>
                            <PredictionsLoader onChange={this.predictionsChange} />
                        </CardBody>
                </Card>
                {this.state.predictions ? <Card className='col-sm-2 p-0'>
                    <CardHeader>Prediction Head</CardHeader>
                    <CardBody>
                        <CheckboxList onChange={this.filteredPredictionTypesChange} checked={this.state.filteredPredictionTypes} options={this.props.predictionTypes}></CheckboxList>
                    </CardBody>
                </Card> : null}
                {this.state.predictions ? <Card className='col-sm-2 p-0'>
                    <CardHeader>Score Filter</CardHeader>
                    <CardBody>
                    <ListGroup>
                    <ListGroupItem>
                        <RangeInput metric='F1' initial={this.props.F1Range} step='0.01' onChange={this.rangeFilterChange}></RangeInput>
                    </ListGroupItem>
                    <ListGroupItem>
                        <RangeInput metric='EM' initial={this.props.EMRange} step='0.01' onChange={this.rangeFilterChange}></RangeInput>
                    </ListGroupItem>
                    </ListGroup>
                    </CardBody>
                </Card> : null}
                {this.state.predictions ? <Card className='col-sm-2 p-0'>
                    <CardHeader>Clipped Filter</CardHeader>
                    <CardBody>
                        <Checkbox text={'Show Clipped'} inline={false}
                            checked={this.state.clippedFilter}
                            onChange={this.clippedFilterChange}></Checkbox>
                        <Checkbox text={'Show Unclipped'} inline={false}
                            checked={this.state.unclippedFilter}
                            onChange={this.unclippedFilterChange}></Checkbox>
                    </CardBody>
                </Card> : null}
            </CardGroup>
        </Container>
    }
}

export default ExplorerSettings;