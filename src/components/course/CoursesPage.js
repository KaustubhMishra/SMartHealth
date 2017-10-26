import React, {PropTypes} from 'react';
import { bindActionCreators } from 'redux';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import * as courseActions from '../../actions/courseActions';
import CourseList from './CourseList';

class CoursesPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.redirectToAddCoursePage = this.redirectToAddCoursePage.bind(this);
    //this.deleteSource = this.deleteSource.bind(this);
  }

  redirectToAddCoursePage() {
    browserHistory.push('/course');
  }

  //deleteSource(event) {

    // if(event)
    // {
    //   this.props.actions.deleteCourse(event)
    //   .then(() => this.redirect())
    //   .catch(error => {
    //     //toastr.error(error);
    //     //this.setState({saving: false});
    //   });
    //   return this.setState({course: course});
    // }
    // else {
    //   return false;
    // }
    // const field = this.props.actions;
    //let course = this.state.course;
    // alert(`field ${JSON.stringify(field)}`);
    // return field;
    //alert(`course ${JSON.stringify(field)}`);
    //course[field] = event.target.value;
    //return this.setState({course: course});
  //}

  // redirect() {
  //   this.setState({saving: false});
  //   //toastr.success('Course Deleted.');
  //   this.context.router.push('/courses');
  // }

  render() {
    return (
      <div>
        <h1>Courses</h1>
        <input type="submit"
               value="Add Course"
               className="btn btn-primary"
               onClick={this.redirectToAddCoursePage}/>

        <CourseList
          courses={this.props.courses}/>
      </div>
    );
  }
}

CoursesPage.propTypes = {
  actions: PropTypes.object.isRequired,
  courses: PropTypes.array.isRequired
  //onDeletCourse: PropTypes.func.isRequired
};

function mapStateToProps(state, ownProps) {
  return {
    courses: state.courses
    //onDeletCourse: state.course
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(courseActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CoursesPage);
