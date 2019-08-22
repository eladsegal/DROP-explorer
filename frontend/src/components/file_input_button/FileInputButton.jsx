import React from 'react';
import {
    Button
} from 'reactstrap';

class FileInputButton extends React.PureComponent {
	constructor(props) {
		super(props);
		this.fileInputRef = React.createRef();
		this.simulateClick = this.simulateClick.bind(this);
		this.change = this.change.bind(this);
		this.state = {
			file: undefined
		};
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.file !== this.state.file) {
			this.props.onChange(this.state.file);
		}
	}

	simulateClick() {
		this.fileInputRef.current.click();
	}

    change(files) {
		let selectedFile;
        if (files.length > 0) {
            const file = files[0]
            if (file) {
				selectedFile = file;
            }
		}

		this.setState({ 
			file: selectedFile
		});
    }

  	render() {      
		return <div>
			<input ref={this.fileInputRef} style={{'display': 'none'}} type='file' id='file' accept={this.props.accept} onChange={ (e) => this.change(e.target.files) } />
			<Button style={this.props.style} color={this.props.color} size={this.props.size} onClick={this.simulateClick}>
				{this.props.text}
			</Button>
			{this.state.file ? this.state.file.name : ''}
		</div>
  }
}

export default FileInputButton;
