import React from 'react';
import {
    Input,
    InputGroupAddon,
    InputGroupText,
    InputGroup
} from 'reactstrap';
import { isChanged } from '../Utils';

class RangeInput extends React.PureComponent {
    constructor(props) {
        super(props);
        this.lowChange = this.lowChange.bind(this);
        this.highChange = this.highChange.bind(this);
        this.state = { 
            low: this.props.initial.low,
            high: this.props.initial.high,
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (isChanged(['low', 'high'], prevState, this.state)) {
            this.props.onChange(this.props.metric, this.state)
        }
    }

    lowChange(event) {
        if (!isNaN(event.target.value)) {
            const newLow = parseFloat(event.target.value)
            this.setState({ 
                low: newLow
            });
        }
    }
    highChange(event) {
        if (!isNaN(event.target.value)) {
            const newHigh = parseFloat(event.target.value)
            this.setState({ 
                high: newHigh
            });
        }
    }

    render() {
        return <div>
        <InputGroup tag='span'>
            <Input onChange={this.lowChange} value={this.state.low} type='number' step='0.01' style={{padding: '0px', textAlign: 'center'}}></Input>
            <InputGroupAddon tag='span' addonType="append">
                <InputGroupText>≤</InputGroupText>
            </InputGroupAddon>
            <span style={{display: 'flex', alignItems: 'center', margin: '5px'}}>{this.props.metric}</span>
            <InputGroupAddon tag='span' addonType="prepend">
                <InputGroupText>≤</InputGroupText>
            </InputGroupAddon>
            <Input onChange={this.highChange} value={this.state.high} type='number' step='0.01' style={{padding: '0px', textAlign: 'center'}}></Input>
        </InputGroup>
      </div>;
    }
}
 
export default RangeInput;