import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "../store/store";
import {
  Box,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
} from "@chakra-ui/react";
import { sendMessage } from "../store/reduses/WS_Slice";

const Contacts = () => {
  interface user_card {
    id: number;
    username: string;
    rooms_id: number;
  }
  const [friends, setFriends] = useState<user_card[]>([]);
  const [waiting_accept, setWaiting_accept] = useState<user_card[]>([]);
  const [recomended_users, setRecomended_users] = useState([]);
  const [isLoadedFriends, setIsLoadedFriends] = useState(false);
  const [isLoadedWaiting, setIsLoadedWaiting] = useState(false);
  const [isLoadedRecomended, setIsLoadedRecomended] = useState(false);

  const messager = useSelector((state: RootState) => state.messagerReducer);
  const socket = useSelector((state: RootState) => state.WS_Slice);
  const data = useSelector((state: RootState) => state.userReducer);

  const dispatch: ThunkDispatch<any, any, any> = useDispatch();
  useEffect(() => {
    /*socket.current = new WebSocket("ws://localhost:3033");
    socket.current.onopen = () => {
      console.log(data.username, "connected to ws");
    };
    socket.current.onmessage = (event) => {
      try {
       
        const message = JSON.parse(event.data);
        console.log(message);
        console.log(message.data);
        switch (message.event) {
          case "get_friends":
            console.log("RETURNS friends lis");
            setFriends(message.data);
            setIsLoadedFriends(true);
            break;
          case "get_waiting_list":
            setWaiting_accept(message.data);
            setIsLoadedWaiting(true);
            break;
          case "accept_friend":
            const timed_wl = waiting_accept.filter(
              (value: any) => value.id !== message[0].data[0].accepted_id
            );
            setFriends([...friends, message[0].data]);
            setWaiting_accept(timed_wl);
            break;
          case "recomended_users":
            //@ts-ignore
            setRecomended_users(message.data);
            console.log(message.data);
            console.log(recomended_users);
            recomended_users.map((user) => {
              console.log(user);
              console.log(user);
            });
            setIsLoadedRecomended(true);

            break;
          default:
            console.log("unhandled event:", message);
            break;
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        console.warn(event.data);
      }
    };*/
    /*
    socket.current.onclose = () => {
      console.log("connection closed");
    };
    socket.current.onerror = () => {
      console.log("SOCKET error");
    };
    */
    get_friends();
    get_recomended();
    get_waiting_list();
  }, []);

  const get_users_rooms_data = async () => {
    if (socket.connected) {
      const message = {
        rooms_for: data.id,
        event: "friends",
      };
      sendMessage(message);
      dispatch(sendMessage(message));
    } 
  };

  const get_recomended = async () => {
    if (socket.connected) {
      sendMessage({ event: "get_recomended_users", page: 1, limit: 10 });
    } 
      return;
      //get_recomended();
    
  };

  const add_friend = async (add_id: any) => {
    console.log(add_id, data.id);

    if (add_id !== data.id) {
      console.log("add frined");
      if (socket.connected) {
        const message = {
          id: add_id,
          add_id: data.id,
          event: "add_friend",
        };
        sendMessage(message);
      }
    } else {
      return;
    }
  };

  const get_friends = async () => {
    if (socket.connected) {
      const message = {
        id: data.id,
        event: "get_friends",
      };
      sendMessage(JSON.stringify(message));
    }
  };

  const get_waiting_list = async () => {
    if (socket.connected) {
      const message = {
        id: data.id,
        event: "get_waiting_list",
      };
      sendMessage(message);
    }
  };

  const delete_friend = async (usr: any) => {
    if (!usr) {
      return alert(`no user id, ${usr}`);
    }
    if (socket.connected) {
      const message = {
        id: data.id,
        to_delete: usr,
        event: "delete_friend",
      };
      sendMessage(message);
    }
  };

  const accept_friend = async (accepted_id: any) => {
    console.log(accepted_id, data.id);
    if (!accepted_id) {
      return alert("!accepted id");
    }

    if (accepted_id !== data.id) {
      console.log("add frined");
      if (socket.connected) {
        const message = {
          id: data.id,
          accept_id: accepted_id,
          event: "accept_friend",
        };
        sendMessage(message);
      }
    } else {
      return;
    }
  };

  const reject_friend = async (reject_id: any) => {
    console.log(reject_id, data.id);
    if (!reject_id) {
      return alert("!accepted id");
    }

    if (reject_id !== data.id) {
      console.log("add frined");
      if (socket.connected) {
        const message = {
          id: data.id,
          reject_id: reject_id,
          event: "reject_request",
        };
        sendMessage(message);
      }
    } else {
      return;
    }
  };

  return (
    <>
      <Flex
        justifyContent={"center"}
        flexDirection={"column"}
        alignItems={"center"}
      >
        <p>friends</p> <p>ctct rm</p>
        <Flex>
          <Box>
            <Tabs>
              <TabList>
                <Tab>Friends</Tab>
                <Tab>Waiting list</Tab>
                <Tab onClick={() => get_friends()}>Recomended list</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Flex flexDirection={"column"}>
                    {data.friends?.map((frd) => (
                      <Box key={frd.id}>
                        <span>{frd.username}</span>
                        <Button onClick={() => delete_friend(frd.id)}>
                          Delete
                        </Button>
                      </Box>
                    ))}
                  </Flex>
                </TabPanel>
                <TabPanel>
                  {data.waiting_list?.map((usr) => (
                    <Box key={usr.id}>
                      <span>{usr.username}</span>
                      <Button onClick={() => accept_friend(usr.id)}>
                        Add to friends
                      </Button>
                      <Button onClick={() => reject_friend(usr.id)}>
                        Reject
                      </Button>
                    </Box>
                  ))}
                </TabPanel>
                <TabPanel>
                  <Flex flexDirection={"column"}>
                    {recomended_users?.map((user) => (
                      //@ts-ignore
                      <span key={user?.id}>
                        <span>
                          {
                            //@ts-ignore
                            user?.username
                          }
                        </span>
                        {
                          //@ts-ignore
                          <Button onClick={() => add_friend(user?.id)}>
                            Add to friends
                          </Button>
                        }
                      </span>
                    ))}
                  </Flex>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Flex>
    </>
  );
};

export default Contacts;
