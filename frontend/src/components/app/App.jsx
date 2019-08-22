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
const state_updateSignals = ['dataset', 'predictions', 'filteredAnswerTypes', 'filteredPredictionTypes',  'searchProps', 'navbarSticky', 'isOpen']
class App extends React.Component {
    constructor(props) {
        super(props);

        this.settingsChange = this.settingsChange.bind(this);
        this.getClearSelectedAnswersFunc = this.getClearSelectedAnswersFunc.bind(this);
        this.getExpandAllFunc = this.getExpandAllFunc.bind(this);
        this.getCollapseAllFunc = this.getCollapseAllFunc.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
        this.state = {
            useLocalDataset: false,
            filteredAnswerTypes: ['multi_span', 'single_span', 'number', 'date'],
            filteredPredictionTypes: ['multi_span', 'single_span', 'number', 'date', 'none'],
            instantSearch: true,
            searchProps: {
                searchText: '',
                filterQuestions: false
            },
            navbarSticky: 'top', // can be 'top' or undefined
            isOpen: true,
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
            true, this.constructor.name);
        return update;
    }

    settingsChange(settings) {
        this.setState({
            filteredAnswerTypes: settings.filteredAnswerTypes,
            filteredPredictionTypes: settings.filteredPredictionTypes,
            searchProps: settings.searchProps,
            dataset: settings.dataset,
            predictions: settings.predictions
        });
    }
    
    getClearSelectedAnswersFunc(func) {
        this.setState({ clearSelectedAnswersFunc: func })
    }

    getExpandAllFunc(func) {
        this.setState({ expandAllFunc: func })
    }

    getCollapseAllFunc(func) {
        this.setState({ collapseAllFunc: func })
    }

    toggleMenu() {
        this.setState({
          isOpen: !this.state.isOpen
        });
    }

    render() {
        return <div>
                    <Navbar color="light" light sticky={this.state.navbarSticky} 
                            style={{'borderBottom': '1px solid rgba(0,0,0,0.15)'}}>
                        <NavbarBrand onClick={() => {this.setState({ navbarSticky: this.state.navbarSticky === 'top' ? undefined : 'top' })}}>
                            DROP Explorer
                        </NavbarBrand>
                        <NavbarToggler onClick={this.toggleMenu} />
                        <Collapse isOpen={this.state.isOpen} navbar>
                            <ExplorerSettings onChange={this.settingsChange}
                                useLocalDataset={this.state.useLocalDataset}
                                expandAllFunc={this.state.expandAllFunc}
                                collapseAllFunc={this.state.collapseAllFunc}
                                filteredAnswerTypes={this.state.filteredAnswerTypes}
                                filteredPredictionTypes={this.state.filteredPredictionTypes}
                                instantSearch={this.state.instantSearch}
                                searchProps={this.state.searchProps}
                                clearSelectedAnswersFunc={this.state.clearSelectedAnswersFunc} />
                        </Collapse>
                    </Navbar>
                    <ExplorerTable 
                        dataset={this.state.dataset} 
                        predictions={this.state.predictions}
                        filteredAnswerTypes={this.state.filteredAnswerTypes}
                        filteredPredictionTypes={this.state.filteredPredictionTypes}
                        searchProps={this.state.searchProps}
                        sendClearSelectedAnswersFunc={this.getClearSelectedAnswersFunc}
                        sendExpandAllFunc={this.getExpandAllFunc}
                        sendCollapseAllFunc={this.getCollapseAllFunc}
                    />
                </div>
    }
}

export default App;