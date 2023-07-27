import { RouteProps } from 'react-router-dom';
import App from './App';
import Eng_Ua from './components/Eng_Ua';
import NotFound from './components/NotFound';
import Streams from './components/Streams';
import Auth from './components/Auth';
import Messeger from './components/Messeger';

const routes: RouteProps[] = [
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/game',
    element: <Eng_Ua />,
  },
  {
    path: '/streams',
    element: <Streams/>
  },
  {
    path:'/authorize',
    element: <Auth/>
  },
  {
    path : '/messager',
    element:<Messeger/>
  },
  // Add more routes as needed
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;