import React from 'react';
import {
    Input,
    FormGroup,
    Label
} from 'reactstrap';

class Checkbox extends React.PureComponent {
    constructor(props) {
        super(props);
        this.change = this.change.bind(this);
        this.state = { 
            checked: this.props.checked
        };
    }

    componentDidUpdate(prevProps, prevState) {
        this.props.onChange(this.state.checked)
    }

    change() {
        this.setState({ checked: !this.state.checked });
    }

    render() {
        return <FormGroup check style={{display: 'inline', ...this.props.style}}>
            <Label check>
                <Input type="checkbox" 
                style={(this.props.style && 
                        this.props.style.fontSize && 
                        this.props.style.fontSize === 'smaller') ? {marginLeft: '-1rem', marginTop: '0.15rem'}: {}}
                onChange={this.change}
                checked={this.state.checked || false} 
                />{this.props.text}
            </Label>
        </FormGroup>;
    }
}
 
export default Checkbox;