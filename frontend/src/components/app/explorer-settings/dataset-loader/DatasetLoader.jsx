import React from 'react';
import DatasetLocalSelector from './DatasetLocalSelector';
import DatasetListSelector from './DatasetListSelector';
import {
    ListGroup,
    ListGroupItem,
    Input,
    FormGroup,
    Label
} from 'reactstrap';

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

    useLocalDatasetChange(e) {
        this.setState({ 
            useLocalDataset: e.currentTarget.getAttribute('use-local-dataset') !== true.toString(),
            dataset: undefined
        });
    }

    datasetChange(dataset) {
        this.setState({ dataset: dataset })
    }

    render() {
        return <ListGroup>
                <ListGroupItem>
                    <FormGroup check>
                        <Label check>
                            <Input type="checkbox" 
                            onChange={this.useLocalDatasetChange}
                            use-local-dataset={(this.state.useLocalDataset && 
                                this.state.useLocalDataset.toString()) || false.toString()} 
                            checked={this.state.useLocalDataset || false} 
                            />Use Local Dataset
                        </Label>
                    </FormGroup>
                </ListGroupItem>
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
