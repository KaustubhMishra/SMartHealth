export default function signupReducer(state = [], action) {
  switch (action.type) {
    case 'CREATE_SIGNUP_COMPANY':
      return [
        ...state,
        Object.assign({}, action.signup)
      ];

    default:
      return state;
  }
}
