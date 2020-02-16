import React, { useContext, Component } from 'react';
import './components/TabNav';
import TabNav from './components/TabNav';
import PitContent from './components/PitContent';
import MatchReportList from './components/MatchReportList';
import AnalystContent from './components/AnalystContent';
import Login from './components/Login';
import Logout from './components/Logout';
import { AuthConsumer, AuthContext, AuthProvider } from './contexts/auth_context';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import PitNavigation from './components/PitNavigation';
import MatchContent from './components/MatchContent';

function RenderTabContent({ selectedTab }) {
  if (selectedTab === 'pit') {
    return <PitNavigation />;
  } else if (selectedTab === 'match') {
    return <MatchReportList />;
  } else {
    return <AnalystContent />;
  }
}

window.onunload = event => {
  window.scrollTo(0, 0);
};


const ProtectedRoute = ({ component: Component, ...rest }) => {
  const authContext = useContext(AuthContext);

  return (
    <Route { ...rest } render={(props) => (
      authContext.isLoggedIn === true
        ? <Component {...props} />
        : <Redirect to={{
            pathname: '/login',
            state: { from: props.location }
          }}/>
    )} />
  )
};

const AdminRoute = ({ component: Component, ...rest }) => {
  const authContext = useContext(AuthContext);

  return (
    <Route { ...rest } render={(props) => (
      authContext.isLoggedIn === true && authContext.user.role === 'admin'
        ? <Component {...props} />
        : <Redirect to={{
            pathname: '/login',
            state: {
              from: props.location,
              messages: [
                { type: 'warning', message: 'You must be an admin to access this page' }
              ]
            }
          }}/>
    )} />
  )
}

class App extends Component {
  state = {
    apiResponse: '',
    selectedTab: '',
  };

  constructor(props) {
    super(props);
    this.authProvider = React.createRef();
  }

  componentDidMount() {
    this.setState({
      selectedTab: localStorage.getItem('selectedTab') || 'match'
    });
    fetch('/api/isLoggedIn').then((response) => {
      if (response.ok) {
        response.json().then((user) => {
          this.authProvider.current.logInUser(user);
        });
      } else {
        this.authProvider.current.logOutUser();
      }
    });
  }

  handleTabSelect = event => {
    this.setState({
      selectedTab: event
    });
    localStorage.setItem('selectedTab', event);
    sessionStorage.clear();
  };

  render() {
    return (
      <AuthProvider ref={this.authProvider}>
        <div className='App'>
          <Router>
            <TabNav onClick={this.handleTabSelect} />
            <Switch>
              <ProtectedRoute path='/pits' exact component={PitNavigation} />
              <ProtectedRoute
                path='/matches/:competition/:team/:matchNum/'
                component={MatchContent}
              />
              <AdminRoute path='/matches/new' component={MatchContent} />
              <ProtectedRoute path='/matches' component={MatchReportList} />
              <ProtectedRoute path='/analystHome' component={AnalystContent} />
              <ProtectedRoute
                path='/pits/:competition/:team'
                exact
                component={PitContent}
              />
              <Route path='/login' component={Login} />
              <Route path='/logout' component={Logout} />
            </Switch>
          </Router>
        </div>
      </AuthProvider>
    );
  }
}

export default App;
