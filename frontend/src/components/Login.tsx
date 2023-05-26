import React, { useState, useEffect } from 'react'
import { api } from '../App'
import { Label, TextInput, Button } from 'flowbite-react';
import { chessStore } from '../store';

export default function Login() {
  const username = chessStore((state) => state.username)
  const setUsername = chessStore((state) => state.setUsername)
  const [formUsername, setFormUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [isSignup, setIsSignup] = useState(false)

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
        // TODO: here, login, logout
        // refresh so that django login is registered
        window.location.reload();
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
      window.location.reload();
    })
  }
  const logout_func: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    api.post('/users', null, {
      params: {
        type: 'logout'
      }
    }).then(() => {
      setUsername('')
      window.location.reload();
    })
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
      When you login/out, the page will need to refresh.
      <Button onClick={login_func}>Login</Button><Button onClick={signup_func}>Sign up</Button></div></div>;
  const logout_comp = <div>Logged in as {username} <button onClick={logout_func}> Logout</button></div>
  return (
    <div>
      {username ? logout_comp : login_comp}
    </div>
  )
}
