import { Center } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { RootState } from "../store/store";
import { useSelector } from "react-redux";
interface RoomProps { 
  room_name: string | undefined
 room_id: number|undefined
 onConnectToRoom: (roomId:number|undefined)=> void;
}


const Room:React.FC<RoomProps> = ({room_id, onConnectToRoom, room_name}) => {
  const [room_messages, setRoomMessages]= useState([])
  const data = useSelector((state: RootState) => state.userReducer);
////// ---------------------------- connecting to socket room
  useEffect(() => {
    if (room_id !== null || undefined){
      console.log(room_id)
    onConnectToRoom(room_id)
  }  

  }, [room_id]);


  console.log(room_name)
  //// if no props
  if (room_id == undefined) {
    return (
      <Center h={window.innerHeight / 1.13} >chs smn</Center>
    );
  }

  else{
    return (<>
    <h1>{room_name}</h1>
  <p></p>
    <div>main room </div>
    </>
    )
  }

 
};

export default Room;
