import axios from 'axios';

class CountryListApi {
  
  static getCountryList() {
    return new Promise((resolve, reject) => {
      axios.get("/getCountryList").then(function(response) {
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

export default CountryListApi;





