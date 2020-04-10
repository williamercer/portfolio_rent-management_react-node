import React, { Suspense, lazy } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'

const SignIn = lazy(() => import('../SignIn'))
const SignUp = lazy(() => import('../SignUp'))
const Profile = lazy(() => import('../Profile'))
const VerifyEmail = lazy(() => import('../VerifyEmail'))
const Users = lazy(() => import('../Users'))
const Apartments = lazy(() => import('../Apartments'))

const routes = (
  <Suspense fallback={<LoadingSpinner />}>
    <Switch>
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/profile" component={Profile} />
      <Route path="/verify-email/:token" exact component={VerifyEmail} />
      <Route path="/users" component={Users} />
      <Route path="/apartments" component={Apartments} />

      <Redirect path="*" to="/sign-in" />
    </Switch>
  </Suspense>

)

export default routes
