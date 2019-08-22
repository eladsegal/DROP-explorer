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
import { shouldUpdate } from '../../Utils';
import { answerTypes, predictionTypes } from '../AnswersUtils';
import SearchFilter from './SearchFilter';
import CheckboxList from '../../checkbox_list/CheckboxList';

const props_updateSignals = []
const state_updateSignals = ['dataset', 'predictions', 'filteredAnswerTypes', 'filteredPredictionTypes', 'searchProps']
class ExplorerSettings extends React.Component {
    constructor(props) {
        super(props);
        this.datasetChange = this.datasetChange.bind(this);
        this.predictionsChange = this.predictionsChange.bind(this);
        this.filteredAnswerTypesChange = this.filteredAnswerTypesChange.bind(this);
        this.filteredPredictionTypesChange = this.filteredPredictionTypesChange.bind(this);
        this.searchFilterChange = this.searchFilterChange.bind(this);
        this.state = {
            filteredAnswerTypes: this.props.filteredAnswerTypes,
            filteredPredictionTypes: this.props.filteredPredictionTypes,
            searchProps: this.props.searchProps
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const update = shouldUpdate(props_updateSignals, state_updateSignals, 
            this.props, this.state, 
            nextProps, nextState, 
            true, this.constructor.name);
        return update;
    }

    componentDidUpdate(prevProps, prevState) {
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
    
    filteredPredictionTypesChange(filteredPredictionTypes) {
        this.setState({ filteredPredictionTypes });
    }

    searchFilterChange(searchProps) {
        this.setState({ searchProps });
    }

    render() {
        return <Container className='ml-0' fluid>
            <CardGroup className='row'>
                <Card className='col-sm-2 p-0'>
                    <CardHeader>Dataset</CardHeader>
                    <CardBody>
                        <DatasetLoader onDatasetChange={this.datasetChange} useLocalDataset={this.props.useLocalDataset} />
                    </CardBody>
                </Card>
                <Card className='col-sm-2 p-0'>
                    <CardBody>
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
                    <CardHeader>Filter Answer Type</CardHeader>
                    <CardBody>
                        <CheckboxList onChange={this.filteredAnswerTypesChange} checked={this.props.filteredAnswerTypes} options={answerTypes}></CheckboxList>
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
                    <CardHeader>Prediction Type</CardHeader>
                    <CardBody>
                        <CheckboxList onChange={this.filteredPredictionTypesChange} checked={this.props.filteredPredictionTypes} options={predictionTypes}></CheckboxList>
                    </CardBody>
                </Card> : null}
            </CardGroup>
        </Container>
    }
}

export default ExplorerSettings;