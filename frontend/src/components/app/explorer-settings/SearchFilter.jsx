import React from 'react';
import {
    Input,
    ListGroup,
    ListGroupItem,
    Button
} from 'reactstrap';
import Checkbox from '../../checkbox/Checkbox';

class SearchFilter extends React.PureComponent {
    constructor(props) {
        super(props);
        this.searchTextChange = this.searchTextChange.bind(this);
        this.filterQuestionsChange = this.filterQuestionsChange.bind(this);
        this.submit = this.submit.bind(this);
        this.state = { 
            ...this.props.searchProps,
            draftSearchText: '',
            draftFilterQuestions: this.props.searchProps.filterQuestions
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.searchText !== this.state.searchText || 
            prevState.filterQuestions !== this.state.filterQuestions) {
            this.props.onChange({
                searchText: this.state.searchText,
                filterQuestions: this.state.filterQuestions
            });
        }
    }

    searchTextChange(event) {
        const newState = { draftSearchText: event.target.value }
        if (this.props.instantSearch) {
            newState.searchText = prepareText(newState.draftSearchText);
        }
        this.setState(newState);
    }

    filterQuestionsChange(newChecked) {
        const filterQuestions = newChecked;
        const newState = { draftFilterQuestions: filterQuestions }
        if (this.props.instantSearch) {
            newState.filterQuestions = newState.draftFilterQuestions;
        }
        this.setState(newState);
    }

    submit(event) {
        this.setState({ 
            searchText: prepareText(this.state.draftSearchText),
            filterQuestions: this.state.draftFilterQuestions
        });
    }

    render() { 
            return <div>
                <ListGroup>
                    <ListGroupItem>
                        <Input type='text' value={this.state.draftSearchText} onChange={this.searchTextChange} />
                    </ListGroupItem>
                    <ListGroupItem>
                        <Checkbox text={'Filter Questions'} 
                                checked={this.state.draftFilterQuestions}
                                onChange={this.filterQuestionsChange}></Checkbox>
                    </ListGroupItem>
                </ListGroup>
                {!this.props.instantSearch ? 
                <ListGroup className='list-group-horizontal mt-1'>
                    <ListGroupItem style={{width: '100%'}}>
                        Searched{this.state.filterQuestions ? ' (Filter Questions)': ''}: <span className='text-info'>{this.state.searchText}</span>
                    </ListGroupItem>
                    <ListGroupItem>
                        <Button color='primary' onClick={this.submit}>Submit</Button>
                    </ListGroupItem>
                </ListGroup> : null}
            </div>;
    }
}

function prepareText(text) {
    return text.toLowerCase();
}

export default SearchFilter;