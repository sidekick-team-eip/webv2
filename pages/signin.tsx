import { Button, TextField } from '@mui/material'
import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { getServerSession } from 'next-auth';
import { GetServerSidePropsContext } from 'next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signIn('signin', {
      email,
      password,
    });
  }

  return (
    <div className='flex items-center justify-center'>
      <form className='flex flex-col space-y-4' onSubmit={handleSubmit}>
        <TextField name='email' label="Email" variant="outlined" value={email} onChange={e => setEmail(e.target.value)} />
        <TextField name='password' type='password' label="Password" variant="outlined" value={password} onChange={e => setPassword(e.target.value)} />
        <Button className="bg-orangePrimary" variant="contained" type='submit'>Login</Button>
      </form>
    </div>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    console.log(session);
    return { redirect: { destination: "/" } };
  }

  return {
    props: {}
  }
}

export default Signin