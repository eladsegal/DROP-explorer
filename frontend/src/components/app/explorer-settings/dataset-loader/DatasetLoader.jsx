import React from 'react';
import DatasetLocalSelector from './DatasetLocalSelector';
import DatasetListSelector from './DatasetListSelector';
import {
    ListGroup,
    ListGroupItem
} from 'reactstrap';
import Checkbox from '../../../checkbox/Checkbox';

class DatasetLoader extends React.PureComponent {
    constructor(props) {
        super(props);
        this.useLocalDatasetChange = this.useLocalDatasetChange.bind(this);
        this.datasetChange = this.datasetChange.bind(this);
        this.state = {
            dataset: undefined,
            useLocalDataset: this.props.useLocalDataset
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.dataset !== this.state.dataset) {
            this.props.onDatasetChange(this.state.dataset);
        }
    }

    useLocalDatasetChange(newChecked) {
        this.setState({ 
            useLocalDataset: newChecked,
            dataset: undefined
        });
    }

    datasetChange(dataset) {
        this.setState({ dataset: dataset })
    }

    render() {
        return <ListGroup>
                {this.props.allowSourceSelection ? <ListGroupItem>
                    <Checkbox text={'Use Local Dataset'} 
                            checked={this.state.useLocalDataset} 
                            onChange={this.useLocalDatasetChange}></Checkbox>
                </ListGroupItem> : null}
                <ListGroupItem>
                    <DatasetSelector onChange={this.datasetChange} local={this.state.useLocalDataset}/>
                </ListGroupItem>
            </ListGroup>
    }
}

function DatasetSelector(props) {
    if (props.local) {
        return <DatasetLocalSelector onChange={props.onChange} />
    }
    return <DatasetListSelector onChange={props.onChange} />
}

export default DatasetLoader;
