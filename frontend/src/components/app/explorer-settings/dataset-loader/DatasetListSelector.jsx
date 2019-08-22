import React from 'react';
import { API_ROOT } from '../../../../api-config';
import { mapToArray } from '../../../Utils';
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from 'reactstrap';

class DatasetListSelector extends React.PureComponent {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.change = this.change.bind(this);
        this.state = {
            dropdownOpen: false,
            datasets_names: [],
            selected: undefined
        };
    }

    toggle() {
        this.setState(prevState => ({
          dropdownOpen: !prevState.dropdownOpen
        }));
    }

    componentDidMount() {
        this.mounted = true;
        this.getDatasetList();
    }
    
    componentDidUpdate(prevProps, prevState) {
        if (prevState.selected !== this.state.selected) {
            this.props.onChange(undefined);
            this.getDataset(this.state.selected);
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    change(e) {
        this.setState({selected: e.currentTarget.getAttribute("dataset-name")});
    }

    getDatasetList() {
        fetch(`${API_ROOT}/dataset-list`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            } 
        }).then((response) => {
            return response.json();
        }).then((json) => {
            if (this.mounted) {
                this.setState({datasets_names: json, selected: json.length > 0 ? json[0] : undefined})
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    getDataset(dataset_name) {
        if (dataset_name) {

            fetch(`${API_ROOT}/dataset?name=${encodeURIComponent(dataset_name)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                } 
            }).then((response) => {
                return response.json();
            }).then((json) => {
                const array = mapToArray(json, 'passage_id')
                this.props.onChange(array);
            }).catch((error) => {
                console.error(error);
            });
        }
    }

    render() {
        const datasets_names = this.state.datasets_names;

        return (
          <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
            <DropdownToggle color="primary" caret style={{width: '100%'}}>
                {this.state.selected ? this.state.selected : "Select..."}
            </DropdownToggle>
            <DropdownMenu>
                {datasets_names.map(dataset_name => <DropdownItem onClick={this.change} key={dataset_name} dataset-name={dataset_name}>{dataset_name}</DropdownItem>)}
            </DropdownMenu>
          </Dropdown>
        );
      }
}

export default DatasetListSelector;
