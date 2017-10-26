import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';

//const courses = [];

// This file mocks a web API by working with the hard-coded data below.
// It uses setTimeout to simulate the delay of an AJAX call.
// All calls return promises.
// const courses = [
//   {
//     id: "1",
//     title: "Clean Code Writing Code for Humans",
//     authorId: "cory-house",
//     length: "3:10",
//     category: "Software Practices"
//   },
//   {
//     id: "2",
//     title: "Architecting Applications for the Real World",
//     authorId: "cory-house",
//     length: "2:52",
//     category: "Software Architecture"
//   },
//   {
//     id: "3",
//     title: "Becoming an Outlier: Reprogramming the Developer Mind",
//     authorId: "cory-house",
//     length: "2:30",
//     category: "Career"
//   },
//   {
//     id: "4",
//     title: "Web Component Fundamentals",
//     authorId: "cory-house",
//     length: "5:10",
//     category: "HTML5"
//   }
// ];
// const getData = axios.get({
//   method: 'get',
//   url: '/getcource'
// });

//const hello = "Hello 123";
// setTimeout(() => {
//   const c = JSON.stringify(getData);
//   alert(`data ${c}`);
// }, delay);

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

//This would be performed on the server in a real app. Just stubbing in.
const generateId = (course) => {
  return replaceAll(course.title, ' ', '-');
};

let courses = [];

class CourseApi {



  static getAllCourses() {
    return new Promise((resolve, reject) => {
      //setTimeout(() => {
        //courses = courses._v.data;
        //Object.assign([], courses)
        //getData._v.data
        axios.get('/getcource').then(response => {
          // const c = JSON.stringify(response);
          // alert(`data c --- ${c}`);
          courses = Object.assign([], response.data);
          resolve(courses);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }

  static saveCourse(course) {
    return new Promise((resolve, reject) => {
      //setTimeout(() => {
        // Simulate server-side validation
        const minCourseTitleLength = 1;
        if (course.title.length < minCourseTitleLength) {
          reject(`Title must be at least ${minCourseTitleLength} characters.`);
        }

        if (course.id) {
          const existingCourseIndex = courses.findIndex(a => a.id == course.id);
          courses.splice(existingCourseIndex, 1, course);

          axios.post(`/updatecourse/${course.id}`,course).then(response => {
            // const c = JSON.stringify(response);
            // alert(`data update --- ${c}`);
            courses.splice(existingCourseIndex, 1, course);
            resolve(Object.assign({}, course));
          }).catch(error => {
            throw(error);
          });


          // axios({
          //   method: 'post',
          //   data: course,
          //   url: `/updatecourse/${course.id}`
          // }).then(response => {
          //   courses.splice(existingCourseIndex, 1, course);
          //   resolve(Object.assign({}, course));
          // }).catch(error => {
          //   resolve(Object.assign({}, course));
          //   throw(error);
          // });
        } else {
          //Just simulating creation here.
          //The server would generate ids and watchHref's for new courses in a real app.
          //Cloning so copy returned is passed by value rather than by reference.
          //course.id = generateId(course);
          //course.watchHref = `http://www.pluralsight.com/courses/${course.id}`;

          axios.post('/addcourse',course).then(response => {
            console.log('---- add response --');
            console.log('---- Old courses --',courses);
            console.log('---- New one --',course);
            console.log('---- New one --',response.data.data);
            // const c = JSON.stringify(response);
            // alert(`data update --- ${c}`);
            //courses.splice(existingCourseIndex, 1, course);
            courses.push(response.data.data);
            console.log('---- New courses --',response.data.data);
            //resolve(Object.assign({}, course));
            resolve(response.data.data);
          }).catch(error => {
            throw(error);
          });


          // axios({
          //   method: 'post',
          //   data: course,
          //   url: '/addcourse'
          // }).then(response => {
          //
          //   //const c = JSON.stringify(response.data.data);
          //   // alert(`data c --- ${c}`);
          //   // courses.push(response.data.data);
          //   // const d = JSON.stringify(courses);
          //   // alert(`data d --- ${d}`);
          //   resolve(Object.assign({}, response.data.data));
          // }).catch(error => {
          //   resolve(Object.assign({}, null));
          //   throw(error);
          // });

        }
      //}, delay);
    });
  }

  static deleteCourse(course) {
    //alert(`Course Id ==== ${course}`);
    return new Promise((resolve, reject) => {
      //setTimeout(() => {

        //alert(`Innnn ==== ${course}`);
        //CourseApi.getAllCourses().then(courses => {

          // const m = JSON.stringify(courses);
          // alert(`data m --- ${m}`);
          // if(confirm('Are you sure to delete.?') == true)
          // {
            axios.post(`/deletecourse/${course.id}`).then(response => {
              // const c = JSON.stringify(response);
              // alert(`data update --- ${c}`);
              //courses.splice(existingCourseIndex, 1, course);
              _.remove(courses,function(c) {
                return course.id == c.id;
              });
              resolve(Object.assign({}, courses));
            }).catch(error => {
              throw(error);
            });
          // }
          // else {
          //   resolve(Object.assign({}, courses));
          // }

          // axios({
          //   method: 'post',
          //   data: course,
          //   url: `/deletecourse/${course.id}`
          // }).then(response => {
          //
          //   _.remove(courses,function(c) {
          //     return course.id == c.id;
          //   });
          //   // const d = JSON.stringify(courses);
          //   // alert(`data d --- ${d}`);
          //
          //   //resolve(courses);
          //
          //   //const c = JSON.stringify(response.data.data);
          //   // alert(`data c --- ${c}`);
          //   // courses.push(response.data.data);
          //   // const d = JSON.stringify(courses);
          //   // alert(`data d --- ${d}`);
          //   resolve(Object.assign({}, courses));
          // }).catch(error => {
          //   resolve();
          //   throw(error);
          // });

          // const indexOfCourseToDelete = courses.findIndex(course => {
          //   course.id == courseId;
          // });

          //const indexOfCourseToDelete = 3;

          //alert(`indexOfCourseToDelete --- ${indexOfCourseToDelete}`);
          //courses.splice(indexOfCourseToDelete, 1);

        // }).catch(error => {
        //   resolve(course);
        //   throw(error);
        // });

      //}, delay);
    });
  }
}

export default CourseApi;
