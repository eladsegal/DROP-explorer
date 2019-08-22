import React from 'react';
import {
    Input,
    FormGroup,
    Label,
    ListGroup,
    ListGroupItem,
    Button
} from 'reactstrap';

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

    filterQuestionsChange(e) {
        const filterQuestions = e.currentTarget.getAttribute('filter-questions') !== true.toString();
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
                        <Input type='text' id='searchBox' value={this.state.draftSearchText} onChange={this.searchTextChange} />
                    </ListGroupItem>
                    <ListGroupItem>
                        <FormGroup check>
                            <Label check>
                                <Input type="checkbox" 
                                onChange={this.filterQuestionsChange}
                                filter-questions={(this.state.draftFilterQuestions && 
                                    this.state.draftFilterQuestions.toString()) || false.toString()} 
                                checked={this.state.draftFilterQuestions || false} 
                                />Filter Questions
                            </Label>
                        </FormGroup>
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