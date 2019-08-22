import React from 'react';
import { mapToArray } from '../../../Utils'
import FileInputButton from '../../../file_input_button/FileInputButton';

class DatasetLocalSelector extends React.PureComponent {
    constructor(props) {
        super(props);
        this.change = this.change.bind(this);
        this.state = {
            dataset: undefined
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.dataset !== this.state.dataset) {
            this.props.onChange(this.state.dataset);
        }
    }

    change(file) {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = (e) => {
                const array = mapToArray(JSON.parse(e.target.result), 'passage_id');
                this.setState({ 
                    dataset: array 
                });
            };
            reader.readAsText(file);
        } else {
            this.setState({ 
                dataset: undefined 
            });
        }
    }

    render() {
        return <FileInputButton accept='.json' text='Choose File' size='md' color='primary' style={{width: '100%'}}
                onChange={this.change}/>
    }
}

export default DatasetLocalSelector;
