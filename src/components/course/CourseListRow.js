import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import * as courseActions from '../../actions/courseActions';

const CourseListRow = ({course}) => {

  const deleteCoursesClick = (course) => () => courseActions.deleteCourse(course);

  return (
    <tr>
      <td>{course.id}</td>
      <td><Link to={'/course/' + course.id}>{course.title}</Link></td>
      <td>{course.authorId}</td>
      <td>{course.category}</td>
      <td>{course.length}</td>
      <td><button onClick={deleteCoursesClick(course)}>Delete</button></td>
    </tr>
  );

};

CourseListRow.propTypes = {
  course: PropTypes.object.isRequired
};

export default CourseListRow;
