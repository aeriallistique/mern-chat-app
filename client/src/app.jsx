import axios from "axios";
import { UserContextProvider } from "./UserContext";
import Routes from "./Routes";


export function App() {

  axios.defaults.baseURL ='http://localhost:4000'
  axios.defaults.withCredentials = true;
  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  )
}
