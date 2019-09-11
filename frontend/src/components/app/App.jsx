import React from 'react';
import {
    Collapse,
    Navbar,
    NavbarToggler,
    NavbarBrand,
} from 'reactstrap';
import { shouldUpdate } from './../Utils';
import ExplorerSettings from './explorer-settings/ExplorerSettings';
import ExplorerTable from './explorer-table/ExplorerTable';

const props_updateSignals = []
const state_updateSignals = ['dataset', 'predictions', 'filteredAnswerTypes', 'answerTypeFilterFirstOnly', 
                            'answerTypeFilterStrict', 'truncatedFilter', 'untruncatedFilter',
                            'predictionTypes', 'filteredPredictionTypes', 'searchProps', 
                            'F1Range', 'EMRange',
                            'navbarSticky', 'isOpen']
class App extends React.Component {
    constructor(props) {
        super(props);

        this.settingsChange = this.settingsChange.bind(this);
        this.getClearSelectedAnswersFunc = this.getClearSelectedAnswersFunc.bind(this);
        this.getExpandAllFunc = this.getExpandAllFunc.bind(this);
        this.getCollapseAllFunc = this.getCollapseAllFunc.bind(this);
        this.predictionTypesChanged = this.predictionTypesChanged.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
        this.state = {
            useLocalDataset: false,
            allowSourceSelection: true,
            filteredAnswerTypes: ['multi_span', 'single_span', 'number', 'date'],
            answerTypeFilterFirstOnly: true,
            answerTypeFilterStrict: false,
            truncatedFilter: true,
            untruncatedFilter: true,
            predictionTypes: [],
            filteredPredictionTypes: [],
            instantSearch: true,
            searchProps: {
                searchText: '',
                filterQuestions: false
            },
            F1Range: { low: 0.0, high: 1.0 },
            EMRange: { low: 0.0, high: 1.0 },
            navbarSticky: undefined, // can be 'top' or undefined
            isOpen: true,
            showNavbarImage: false,
            // ^ startup settings available for configuration

            dataset: undefined,
            predictions: undefined,
            clearSelectedAnswersFunc: undefined,
            expandAllFunc: undefined,
            collapseAll: undefined
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const update = shouldUpdate(props_updateSignals, state_updateSignals, 
            this.props, this.state, 
            nextProps, nextState, 
            false, this.constructor.name);
        return update;
    }

    settingsChange(settings) {
        this.setState({
            filteredAnswerTypes: settings.filteredAnswerTypes,
            answerTypeFilterFirstOnly: settings.answerTypeFilterFirstOnly,
            answerTypeFilterStrict: settings.answerTypeFilterStrict,
            truncatedFilter: settings.truncatedFilter,
            untruncatedFilter: settings.untruncatedFilter,
            filteredPredictionTypes: settings.filteredPredictionTypes,
            searchProps: settings.searchProps,
            dataset: settings.dataset,
            predictions: settings.predictions,
            F1Range: settings.F1Range,
            EMRange: settings.EMRange
        });
    }
    
    getClearSelectedAnswersFunc(func) {
        this.setState({ clearSelectedAnswersFunc: func });
    }

    getExpandAllFunc(func) {
        this.setState({ expandAllFunc: func });
    }

    getCollapseAllFunc(func) {
        this.setState({ collapseAllFunc: func });
    }

    predictionTypesChanged(predictionTypes) {
        this.setState({ predictionTypes });
    }

    toggleMenu() {
        this.setState({
          isOpen: !this.state.isOpen
        });
    }

    render() {
        return <div>
                    <Navbar color="light" light sticky={this.state.navbarSticky} 
                            style={{borderBottom: '1px solid rgba(0,0,0,0.15)'}}>
                        <div style={{width: '100%'}}>
                            {this.state.showNavbarImage ? 
                            <div className='navbar-brand'>
                                {<a target='_blank' rel='noopener noreferrer' href='https://allennlp.org/drop'>
                                    <img style={{paddingRight: '15px', marginBottom: '3px'}} src='https://allennlp.org/assets/allennlp-logo-color.png' height='14' alt='' />
                                </a>}
                                <button className='fakeLink' onClick={() => {this.setState({ navbarSticky: this.state.navbarSticky === 'top' ? undefined : 'top' })}}>DROP Explorer</button>
                            </div> : 
                            <NavbarBrand onClick={() => {this.setState({ navbarSticky: this.state.navbarSticky === 'top' ? undefined : 'top' })}}>
                                DROP Explorer
                            </NavbarBrand>}
                            <NavbarToggler style={{float: 'right', marginTop: '0.25rem'}} onClick={this.toggleMenu} />
                        </div>
                        <Collapse isOpen={this.state.isOpen} navbar>
                            <ExplorerSettings onChange={this.settingsChange}
                                useLocalDataset={this.state.useLocalDataset}
                                allowSourceSelection={this.state.allowSourceSelection}
                                expandAllFunc={this.state.expandAllFunc}
                                collapseAllFunc={this.state.collapseAllFunc}
                                filteredAnswerTypes={this.state.filteredAnswerTypes}
                                answerTypeFilterFirstOnly={this.state.answerTypeFilterFirstOnly}
                                answerTypeFilterStrict={this.state.answerTypeFilterStrict}
                                truncatedFilter={this.state.truncatedFilter}
                                untruncatedFilter={this.state.untruncatedFilter}
                                filteredPredictionTypes={this.state.filteredPredictionTypes}
                                predictionTypes={this.state.predictionTypes}
                                instantSearch={this.state.instantSearch}
                                searchProps={this.state.searchProps}
                                F1Range={this.state.F1Range}
                                EMRange={this.state.EMRange}
                                clearSelectedAnswersFunc={this.state.clearSelectedAnswersFunc} />
                        </Collapse>
                    </Navbar>
                    <ExplorerTable 
                        dataset={this.state.dataset} 
                        predictions={this.state.predictions}
                        filteredAnswerTypes={this.state.filteredAnswerTypes}
                        answerTypeFilterFirstOnly={this.state.answerTypeFilterFirstOnly}
                        answerTypeFilterStrict={this.state.answerTypeFilterStrict}
                        truncatedFilter={this.state.truncatedFilter}
                        untruncatedFilter={this.state.untruncatedFilter}
                        filteredPredictionTypes={this.state.filteredPredictionTypes}
                        searchProps={this.state.searchProps}
                        F1Range={this.state.F1Range}
                        EMRange={this.state.EMRange}
                        sendClearSelectedAnswersFunc={this.getClearSelectedAnswersFunc}
                        sendExpandAllFunc={this.getExpandAllFunc}
                        sendCollapseAllFunc={this.getCollapseAllFunc}
                        onPredictionsTypeChanged={this.predictionTypesChanged}
                    />
                </div>
    }
}

export default App;