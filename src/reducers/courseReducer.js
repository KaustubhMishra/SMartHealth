import * as types from '../actions/actionTypes';
import initialState from './initialState';
import {browserHistory} from 'react-router';
// IMPORTANT: Note that with Redux, state should NEVER be changed.
// State is considered immutable. Instead,
// create a copy of the state passed and set new values on the copy.
// Note that I'm using Object.assign to create a copy of current state
// and update values on the copy.
export default function courses(state = initialState.courses, action) {
  switch (action.type) {
    case types.LOAD_COURSES_SUCCESS:
      return action.courses;

    case types.CREATE_COURSE_SUCCESS:
      return [
        ...state,
        Object.assign({}, action.course)
      ];

    case types.UPDATE_COURSE_SUCCESS:{

      const newState = Object.assign([], state);
      const abc = JSON.stringify(newState);
      alert(`data ab update reducer --- ${abc}`);
      return [
        ...state.filter(course => course.id !== action.course.id),
        Object.assign({}, action.course)
      ];
    }

    case types.DELETE_COURSE_SUCCESS:{

      //(`hello ${action.course}`);
      // return [
      //   ...state.filter(course => course.id !== action.course.id),
      //   Object.assign({}, action.course)
      // ];
      // const ab = JSON.stringify(action.course);
      // alert(`data ab delet reducer--- ${ab}`);

      const newState = Object.assign([], state);
      // const abc = JSON.stringify(newState);
      // alert(`data abc --- ${abc}`);
      const indexOfCatToDelete = state.findIndex(course => {return course.id == action.course.id; });
      //alert(`index --- ${indexOfCatToDelete}`);
      newState.splice(indexOfCatToDelete, 1);

      const abd = JSON.stringify(action.course);
      alert(`data after remove abd --- ${abd}`);
      browserHistory.push('/courses');
      return newState;
    }


    default:
      return state;
  }
}
