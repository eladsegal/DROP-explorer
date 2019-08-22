import React from 'react';
import FileInputButton from '../../file_input_button/FileInputButton';

class PredictionsLoader extends React.PureComponent {
    constructor(props) {
        super(props);
        this.change = this.change.bind(this);
        this.state = {
            predictions: undefined
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.predictions !== this.state.predictions) {
            this.props.onChange(this.state.predictions);
        }
    }

    change(file) {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = (e) => {
                const predictions = [];
                e.target.result.split('\n').forEach(line => {
                    if (line) {
                        predictions.push(JSON.parse(line));
                    }
                });
                this.setState({ 
                    predictions: predictions 
                });
            };
            reader.readAsText(file);
        } else {
            this.setState({ 
                predictions: undefined 
            });
        }
    }

    render() {
        return <FileInputButton accept='.json, .jsonl' text='Choose File' size='md' color='primary' style={{width: '100%'}}
        onChange={this.change}/>
    }
}

export default PredictionsLoader;
