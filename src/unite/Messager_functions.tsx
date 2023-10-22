import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3033/room',
  });
export const get_notify=async (id:number)=>{
  try {
    const responce = await api.post('/get_notify', {id})
 return responce.data
  } catch (error) {
    console.warn(error)
  }
 
}