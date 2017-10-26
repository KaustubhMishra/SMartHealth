import CourseApi from '../api/mockCourseApi';
import * as types from './actionTypes';
import {beginAjaxCall, ajaxCallError} from './ajaxStatusActions';
import {createStore} from 'redux';
import courses from '../reducers/courseReducer';
const store =  createStore(courses);
//store.dispatch({type: types.DELETE_COURSE_SUCCESS});

export function loadCoursesSuccess(courses) {
  return {type: types.LOAD_COURSES_SUCCESS, courses};
}

export function createCourseSuccess(course) {
  return {type: types.CREATE_COURSE_SUCCESS, course};
}

export function updateCourseSuccess(course) {
  return {type: types.UPDATE_COURSE_SUCCESS, course};
}

export function deleteCourseSuccess(course) {
  alert(`--- reducer courses ----`);
  //return {type: types.DELETE_COURSE_SUCCESS, course};
  return store.dispatch({type: types.DELETE_COURSE_SUCCESS, course});
}

// Functions below handle asynchronous calls.
// Each returns a function that accepts a dispatch.
// These are used by redux-thunk to support asynchronous interactions.
export function loadCourses() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return CourseApi.getAllCourses().then(courses => {
      dispatch(loadCoursesSuccess(courses));
    }).catch(error => {
      throw(error);
    });
  };
}

export function saveCourse(course) {
  return function (dispatch, getState) {
    console.log('---- add api action call --',course);

    dispatch(beginAjaxCall());
    return CourseApi.saveCourse(course).then(course => {
      console.log('---- add api action Response  --',course);
      course.id ? dispatch(updateCourseSuccess(course)) : dispatch(createCourseSuccess(course));
    }).catch(error => {
      dispatch(ajaxCallError(error));
      throw(error);
    });
  };
}

export function deleteCourse(course) {
  // alert(`dispatch -- ${course}`);
  // const m = JSON.stringify(course);
  // alert(`data m --- ${m}`);
  // return CourseApi.deleteCourse(course).then(() => {
  //     alert(`Remove data ${course}`);
  //     const ab = JSON.stringify(course);
  //     alert(`data ab --- ${ab}`);
  //     deleteCourseSuccess(course);
  //     return;
  //   }).catch(error => {
  //     throw(error);
  //   });
  //return function(dispatch) {
    return CourseApi.deleteCourse(course).then(() => {
      //alert(`Remove data ${course}`);
      deleteCourseSuccess(course);
      return;
    }).catch(error => {
      throw(error);
    });
  //};
}

// export function deleteCourse(courseId) {
//   alert(courseId);
//   //return function (dispatch, getState) {
//     //dispatch(beginAjaxCall());
//     return CourseApi.deleteCourse(courseId).then(courses => {
//       alert(`Remove data ${courseId}`);
//       //deleteCourseSuccess(courses);
//       //course.id ? dispatch(updateCourseSuccess(course)) : dispatch(createCourseSuccess(course));
//     }).catch(error => {
//       //dispatch(ajaxCallError(error));
//       throw(error);
//     });
//   //};
// }
