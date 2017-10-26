import axios from 'axios';

class TimezoneApi {
  
  static getTimezone() {
    return new Promise((resolve, reject) => {
      axios.get("/gettimezonelist").then(function(response) {
        if(response.data.status == true)
          {
            resolve(response.data.data);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }
}

export default TimezoneApi;



