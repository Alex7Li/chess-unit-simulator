import React, { useState, useEffect } from 'react'
import { api } from '../App'
import { Label, TextInput, Button } from 'flowbite-react';
import { chessStore } from '../store';
import { onLogin as fetchDataOnLogin, onLogin } from '../networking';
import { format_username } from './utils'


export default function Login() {
  const username = chessStore((state) => state.username)

  useEffect(() => {
    api.get('/users', {
      params: {}
    }).then((response) => {
      onLogin(response.data.username)
    })
  }, [])

  let username_comp = format_username(username)
  const logout_comp = <div>Logged in as {username_comp} <a href='/accounts/logout'> Logout</a></div>
  return (
    <div>
      {username ? logout_comp : <a href="/accounts/login">Click here to login</a>}
    </div>
  )
}
