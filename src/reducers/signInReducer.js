export default function signInReducer(state = [], action) {
  switch (action.type) {
    case 'CREATE_SIGNIN':
      return action.signIn;

    default:
      return state;
  }
}
