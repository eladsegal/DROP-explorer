import React from 'react';
import {
    Input,
    FormGroup,
    Label
} from 'reactstrap';

class CheckboxList extends React.PureComponent {
    constructor(props) {
        super(props);
        this.change = this.change.bind(this);
        this.state = { 
            checked: this.props.checked
        };
    }

    componentDidUpdate(prevProps, prevState) {
        this.props.onChange(this.state.checked);
    }

    change(e) {
        const changedKey = e.currentTarget.getAttribute('option-key');
        const changedKeyIndex = this.state.checked.indexOf(changedKey);
        let newChecked;
        if (changedKeyIndex !== -1) {
            newChecked = [...this.state.checked];
            newChecked.splice(changedKeyIndex, 1);
        } else {
            newChecked = [...this.state.checked, changedKey];
        }
        this.setState({ checked: newChecked });
    }

    render() {
        return this.props.options.map(option => {
            return <FormGroup check key={option.key}>
                        <Label check>
                            <Input type="checkbox" 
                            onChange={this.change}
                            option-key={option.key}
                            checked={(this.state.checked && 
                                this.state.checked.includes(option.key)) || 
                                false} 
                            />{option.value}
                        </Label>
                    </FormGroup>
        });
    }
}
 
export default CheckboxList;