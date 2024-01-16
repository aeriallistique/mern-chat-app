import axios from "axios";
import Register from "./Register";
import { UserContextProvider } from "./UserContext";


export function App() {

  axios.defaults.baseURL ='http://localhost:4000'
  axios.defaults.withCredentials = true;
  const {username} = useContext(UserContext);
  return (
    <UserContextProvider>
      <Register />
    </UserContextProvider>
  )
}
