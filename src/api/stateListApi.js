import axios from 'axios';

let state = [];

class StateApi {
  
  static getStateList(id) {
    var data = {
      id: id
    };
    return new Promise((resolve, reject) => {
      axios.post("/getStateList", data).then(function(response) {
        if(response.data.status == true)
          {
            state = Object.assign([], response.data.data)
            resolve(state);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }

}

export default StateApi;
