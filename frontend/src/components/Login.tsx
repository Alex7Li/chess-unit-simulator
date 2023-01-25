import React, { useState, useEffect } from 'react'
import { api } from '../App'
import { Label, TextInput, Button } from 'flowbite-react';


export default function Login() {
  let [username, setUsername] = useState('')
  let [formUsername, setFormUsername] = useState('')
  let [password, setPassword] = useState('')
  let [email, setEmail] = useState('')
  let [isSignup, setIsSignup] = useState(false)

  useEffect(() => {
    api.get('/users', {
      params: {
        type: 'check_current_user',
      }
    }).then((response) => {
      setUsername(response.data.username)
    })
  }, [])

  const signup_func: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!isSignup) {
      setIsSignup(true);
    } else {
      api.post('/users', null, {
        params: {
          username: formUsername,
          password: password,
          email: email,
          type: 'signup'
        }
      }).then(() => {
        setUsername(formUsername)
      })
    }
  }
  const login_func: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setIsSignup(false);
    api.post('/users', null, {
      params: {
        username: formUsername,
        password: password,
        type: 'login'
      }
    }).then(() => {
      setUsername(formUsername)
    })
  }
  const logout_func: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    api.delete('/users').then(() => setUsername(''))
  }
  const login_comp = <div className="flex flex-col gap-4 p-2">{isSignup ? <div>
      <div className="mb-2 block">
        <Label
          htmlFor="email1"
          value="Your email (In case you forget password, no mailing list)"
        />
      </div>
      <TextInput
        id="email1"
        type="email"
        placeholder="name@gmail.com"
        required={true}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div> : <></>}
    <div>
      <div className="mb-2 block">
        <Label
          htmlFor="username"
          value="Your username"
        />
      </div>
      <TextInput
        id="name1"
        placeholder="username"
        required={true}
        value={formUsername}
        onChange={(e) => setFormUsername(e.target.value)}
      />
    </div>
    <div>
      <div className="mb-2 block">
        <Label
          htmlFor="password1"
          value="Your password"
        />
      </div>
      <TextInput
        id="password1"
        type="password"
        required={true}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </div>
    <div className="flex p-2 m-2">
      <Button onClick={login_func}>Login</Button><Button onClick={signup_func}>Sign up</Button></div></div>;
  const logout_comp = <div>Logged in as {username} <button onClick={logout_func}> Logout</button></div>
  return (
    <div>
      {username ? logout_comp : login_comp}
    </div>
  )
}

// interface GlobalState {
//   mouseDownState: number;
//   messages: Array<String>;
//   user?: string
// }
// interface OptionalGlobalState {
//   mouseDownState?: number;
//   messages?: Array<String>;
//   user?: string
// }
// const initialState: GlobalState = {
//   'mouseDownState': 0,
//   'messages': [],
// };

// const reducer = (state: GlobalState, newValue: OptionalGlobalState) => {
//   if(newValue.user != undefined) {
//     window.localStorage.setItem('user', JSON.stringify(state));
//   }
//   return { ...state, ...newValue };
// };

// const init = () => {
//   let preloadedState;
//   let preloadedStateStr =  window.localStorage.getItem('user');
//   if(preloadedStateStr == undefined) {
//     preloadedState = ""
//   }else {
//     preloadedState = JSON.parse(preloadedStateStr);
//   }
//   // TODO: validate preloadedState
//   return {...preloadedState, ...initialState};
// };

// const useValue = () => {
//   const [state, dispatch] = useReducer(reducer, null, init);
//   return [state, dispatch];
// };

// const {
//   Provider,
//   useTracked,
//   // ...
// } = createContainer(useValue);