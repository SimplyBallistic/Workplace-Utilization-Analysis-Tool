import React, {Component} from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormFeedback,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Row
} from 'reactstrap';
import axios from 'axios';
import 'react-tabulator/css/tabulator_simple.min.css'
import {ReactTabulator} from 'react-tabulator';
import LoadingAnimation from "../../utils/LoadingAnimation";
import {getStyle} from "@coreui/coreui/dist/js/coreui-utilities";
import tutorial from './../../utils/tutorial';


const columns = (container) => {
  return [
    {title: "Name", field: "friendlyName", editor: true},
    {title: "Created on", field: "creationDate", align: "center"},
    {title: "Label", field: "name", align: "center"},
  ]
};

class MonitorGroups extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,//whether the table is loading, initially true, controls loading animation
      data: [],//table data to display
      errors: {},//errors and fields listed for the register form
      name: '',
      hint: !tutorial.isFinished('edit_team_names'),
      formLoading: false//whether the registration form is processing, disables the submit button
    }

  }

  componentDidMount() {//on component mount, we try fetch data from db
    this.setState({loading: true});//make the loading animation begin
    axios('/api/teams/list').then(dat => {//try fetch user data
      let data = [];
      dat.data.forEach(team => {//for every team given from the backend
        //make sure all the data is pretty for displaying to user
        team.creationDate = new Date(team.creationDate).toDateString();
        team.employeeCount = team.employees ? team.employees.length : 0;
        data.push(team)

      });
      this.setState({data, loading: false});//update table and stop loading animation
    });
  }

  editedData(data) {//when a cell is edited
    let cell = data._cell;
    let type = cell.column.field;
    let id = cell.row.data._id;
    let value = cell.value;
    axios.post('/api/teams/edit/name', {id, value}).catch(err => {//try update the relevant permission
      this.componentDidMount();//if we failed, try refresh the table instead of showing false success
    });
  }

  register = (e) => {//when the user tries to register a new user
    e.preventDefault();//prevent the default HTML form submit
    this.setState({formLoading: true, errors: {}});//start loading animation
    axios.post('/api/teams/edit/create', {//try register team with form data form state
      name: this.state.name
    }).then(res => {//success?
      this.setState({formLoading: false});//remove loading animation
      this.componentDidMount();//reload table with new user
    }).catch(err => {//failed?
      this.setState({errors: err.response.data, formLoading: false});//stop loading animation and show why it failed to user
    });


  };
  onChange = e => {
    this.setState({[e.target.id]: e.target.value});//edit fields while also storing it in state

  };


  render() {
    const buttonStyle = {//submit button style, with better colors to match theme
      backgroundColor: getStyle('--theme-light'),
      borderColor: getStyle('--theme-bland'),
      color: '#fff'
    };

    //render html page to user, comments cannot be inserted within a html document when using JSX
    return (
      <div className="animated fadeIn">
        <Row>
          <Col xs="12" sm="8">
            <Card>
              <CardHeader>
                <i className="fa fa-user"/> Monitor Groups
              </CardHeader>
              <CardBody>
                {this.state.loading ? <LoadingAnimation/> :
                  this.state.data.length === 0 ?
                    <div className="text-center text-muted">Connect some monitors to get started</div> :
                    <div>
                      <ReactTabulator
                        data={this.state.data}
                        columns={columns(this)}
                        tooltips={true}
                        layout={"fitData"}
                        cellEdited={(data) => this.editedData(data)}
                      />
                      <Alert color="primary" isOpen={this.state.hint}
                             toggle={() => {
                               this.setState({hint: false});
                               tutorial.addFinished("edit_team_names")
                             }}>
                        <h6>Did you know?</h6>
                        You can rename monitors by clicking on its name. Try it out! You may also select a monitor in order to edit it.
                      </Alert>
                    </div>
                }

              </CardBody>
            </Card>


          </Col>
          <Col xs="12" sm="4">
            <Card>
              <CardHeader>
                <i className="fa fa-plus"/> Add a Team
              </CardHeader>
              <CardBody>
                <Form noValidate>
                  <FormGroup>
                    <InputGroup>
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="icon-user"/></InputGroupText>
                      </InputGroupAddon>
                      <Input value={this.state.name} onChange={this.onChange}
                             className={this.state.errors.name ? 'is-invalid' : ''} type="text" id="name" name="name"
                             placeholder="Name"/>
                      <FormFeedback>{this.state.errors.name}</FormFeedback>
                    </InputGroup>
                  </FormGroup>
                  <FormGroup>
                    <Button type="submit" color="success" onClick={this.register} style={buttonStyle}
                            disabled={this.state.formLoading}>
                      {this.state.formLoading ? <span className="lds-tiny-dual-ring"/> : 'Submit'}
                    </Button>
                  </FormGroup>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>

      </div>);
  }
}

export default MonitorGroups;