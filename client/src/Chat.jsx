import {useEffect, useState, useContext, useRef} from 'react';
import Avatar from './Avatar';
import Logo from './Logo';
import { UserContext } from './UserContext';
import {uniqBy} from "lodash";
import axios from 'axios';
import { connect } from 'mongoose';

import Contact from '../Contact';

export default function Chat(){
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({})
  const [selectedUserId, setSelectedUserId] = useState(null)
  const {username, id, setId, setUsername} = useContext(UserContext);
  const [newMessageText, setNewMessageText] = useState('')
  const [messages, setMessages] = useState([]);
  const divUnderMessages = useRef();
  const [offlinePeople, setOfflinePeople] = useState({})

  useEffect(()=>{
    connectToWS();
  },[])

  useEffect(()=>{
    axios.get('/people').then(res =>{
      const offlinePeopleArr = res.data.filter(p => p._id !== id)
      .filter(p => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {}
      offlinePeopleArr.forEach(p =>{
        offlinePeople[p._id] = p;
      })
      setOfflinePeople(offlinePeople)
    })
  },[onlinePeople])


  function connectToWS(){
    const ws = new WebSocket('ws://localhost:4000');
      setWs(ws);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('close', ()=>{
        setTimeout(()=>{ 
          console.log('Disconnected. Trying to reconnect.')
          connectToWS();
        }, 1000)
      });
  }

  useEffect(()=>{
    const div = divUnderMessages.current;
    if(div){
      div.scrollIntoView({behavior:'smooth', block:'end'})
    }
  },[messages])

  useEffect(()=>{
    if(selectedUserId){
      axios.get('/messages/'+selectedUserId).then(response => {
        
        setMessages(response.data)
      })
    }
  },[selectedUserId])

  function showOnlinePeople(peopleArray){
    const people = {}
    peopleArray.forEach(({userId, username})=>{
      people[userId] = username;
    })
    setOnlinePeople(people);
  }

  function sendMessage(ev){
    ev.preventDefault();
    ws.send(JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      }
    ));
    setNewMessageText('')
    setMessages(prev => ([...prev, {
      text: newMessageText, 
      sender: id,
      recipient: selectedUserId,
      _id: Date.now(),
    }]))
  }

  function handleMessage(ev){
    const messageData = JSON.parse(ev.data);
    
    if('online' in messageData){
      showOnlinePeople(messageData?.online)
    }else if('text' in messageData){
      setMessages(prev => ([...prev, {...messageData}]))
    }
  }

  function logout(){
    axios.post('/logout').then(()=>{
      setWs(null);
      setId(null);
      setUsername(null);
    })
  }
  const onlinePeopleExclOurUser = {...onlinePeople};
  delete onlinePeopleExclOurUser[id]

  const messagesWithoutDups = uniqBy(messages, '_id');

  return(
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <div className='flex-grow'>
          <Logo />
          {Object.keys(onlinePeopleExclOurUser).map(userId =>(
            <Contact 
              key={userId}
              id={userId}
              online={true} 
              username={onlinePeopleExclOurUser[userId]}
              onClick={()=> setSelectedUserId(userId)}  
              selected={userId === selectedUserId}
            />
          ))}
          {Object.keys(offlinePeople).map(userId =>(
            <Contact 
              key={userId}
              id={userId}
              online={false} 
              username={offlinePeople[userId].username}
              onClick={()=> setSelectedUserId(userId)}  
              selected={userId === selectedUserId}
            />
          ))}
        </div>
       
        <div className='p-2 text-center flex items-center justify-center'>
            <span className='mr-2 text-sm text-gray-600 flex items-center'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
             {username} 
          </span>
            <button
              onClick={logout} 
              className='text-sm bg-blue-100 py-1 px-2 text-gray-600 border rounded-sm'>Logout</button>
        </div>
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className='flex h-full flex-grow items-center justify-center'>
            <div className='text-gray-300'> &larr; Select person from the sidebar</div>  
            </div>
          )}
        {!!selectedUserId && (
          <div className='relative h-full'>
            <div className='overflow-y-scroll absolute top-0 left-0 right-0 bottom-2'>
              {messagesWithoutDups.map(message => (
                <div key={message._id} className={message.sender === id ? 'text-right' : 'text-left'}>
                  <div className={"text-left inline-block p-2 my-2 rounded-sm text-sm " +( message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                    {message.text}
                  </div>   
                </div>
                ))}
                <div ref={divUnderMessages}></div>
            </div>
          </div>
        )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2 " onSubmit={sendMessage}>
            <input
              value={newMessageText}
              onChange={(ev)=> setNewMessageText(ev.target.value)} 
              type="text" 
              placeholder="type your message here" 
              className="bg-white border p-2 flex-grow rounded-sm w"/>
              <button type='submit' className="bg-blue-500 p-2 text-white rounded-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
          </form>
        )}
        
      </div>
    </div>
  )
}