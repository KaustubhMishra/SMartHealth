import axios from 'axios';
import cookies from 'react-cookie';

class resetPassword {
  
  static resetApi(signIn) {
    var basicToken = "Basic "+ cookies.load('basicToken');
    return new Promise((resolve, reject) => {
      	axios.post('/resetpassword',{
   	            token: signIn.token,
                password: signIn.password
        }
        ,{
            headers: {
                'Authorization': basicToken
            },
        }).then(function(response){
          resolve(response);

        })
    });

  }

  static getBasicToken() {
    cookies.remove('basicToken', { path: '/' });
    return new Promise((resolve, reject) => {
      axios.get("/getToken").then(function(response) {
        if(response.data.status == true)
          {
            cookies.save('basicToken', response.data.data);
            resolve(response.data);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }


}

export default resetPassword;
