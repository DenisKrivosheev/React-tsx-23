const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const WebSocket = require('ws');
require("dotenv");
const Redis = require ('ioredis');
const { response } = require("express");

const redis = new Redis({  
  port: 6379,        
  // docker run -d --name <CONTAINER_NAME> -p 127.0.0.1:6379:6379 redis
})
 
const set_new_today = async() =>{
  const total = await redis.get('users_per_day');

  await redis.set('users_per_day', Number(total)+1)
}


 try {
   
  async function set() {
    await redis.config("SET", "save", "")
    await redis.set('users_per_day', '0');
    }
  async function get() {
    const val = await redis.get('users_per_day');
    console.log('testing users-per-day get:', val);
  }
  set()
  get()
 } catch (error) {
  console.log("error",error) 
 }
  



const generate_jwt = (date, username, role, secret) => {
  data = { date, username, role };
  const token = jwt.sign(data, secret);
  return token;
};


const test_db_connection = async() =>{
  const query = await db.query('SELECT * FROM global_info')
  if(!query){
    console.log('database error')
  }
  console.log('TESTING DB QUERY is: ',query.rows[0])
}
 
test_db_connection()

class UserController {
  async registration(req, res) {
    const { email, username, password } = req.body;
    const createdat = new Date();
    console.log(createdat);
    const hashPassword = await bcrypt.hash(password, 5);
    console.log(hashPassword);
    try{
    const newUser = await db.query(
      'INSERT INTO users (email, username, password, createdat, updatedat) values ($1, $2, $3, $4, $5) RETURNING *',
      [email, username, hashPassword, createdat, createdat]
    );        
    console.log(newUser)
    const secret = process.env.SECRET_JWT;
    const user = await db.query("SELECT id, role, createdAt FROM users WHERE username = $1", [newUser.rows[0].username])
    const id = user.rows[0].id
    const user_date = user.rows[0].createdat
    const user_role = user.rows[0].role
    const token = generate_jwt(user_date, username, user_role, secret);
    
    console.log(user_date, user_role, token)
    const data = {
      id,
      token,
      username,
      email,
      user_role
      
    };  
      set_new_today()
    res.json(data);
  }
    catch(e){
      if (e.code == 23505){
          return res.json({error: "user already created"})
      }
      return console.log(e) 
    }
  }


  async login(req, res, next) {
    const { email, username, password } = req.body;
    
    console.log(email, username, password);
    let user;
    
    if (email === "") {
      console.log("log with username");
      user = await db.query(
        "select id, email, username, password, role, createdAt from users where username = $1",
        [username]
      );
      if (user.rows[0] === undefined) {
        return res.status(403).json({error_user:"user not found"});
      }
    }
    if (username === "") {
      console.log("log with em");
      user = await db.query(
        "select id, email, username, password, role, createdAt from users where email = $1",
        [email]
      );
      if (user.rows[0] === undefined) {
        return res.status(403).json({error_user : "error user not found"});
      }
    }
  
    let comparePassword = bcrypt.compareSync(password, user.rows[0].password);
    if (!comparePassword){
      return res.status(403).json({error_password : " incorrect password"});
    }
    const secret = process.env.SECRET_JWT;
    
    const token = generate_jwt(user.rows[0].createdat, username,user.rows[0].role, secret);
    console.log(user.rows[0].createdat)
    const id = user.rows[0].id
    const log_user = user.rows[0].username;
    const log_email = user.rows[0].email;
    const role = user.rows[0].role;

    const data = {
      id,
      token,
      log_user,
      log_email,
      role
    };   
    console.log(user.rows[0].password);
    res.json(data) 

 
    // need a exception cheker
    const query = 'UPDATE global_info SET "USERS_PER_DAY" = "USERS_PER_DAY"::integer + 1'
    const updt_login = await db.query(query)
    set_new_today()
  }


  async check(req, res) {
    const { token } = req.body;
    try {
      const decoded = jwt.verify(token, secret);
      res.json(decoded);
    } catch (error) {
      res.json('Error decoding JWT:', error.message);
    }
  }


  async getAll(req, res) {     
    try{
    const {token, username} = req.body
    if (token == null || username == ""){ }
    else{
    const user_db = await db.query("SELECT createdAt, role FROM users WHERE username = $1 ", [username])
    console.log("user data is", user_db.rows[0])
    const date = user_db.rows[0].createdat
    const role = user_db.rows[0].role
    const data = {
      date,
      username,
      role
    }
    const secret = process.env.SECRET_JWT;
    const decode = jwt.verify(token, secret)
    const verify = decode.role == "ADMIN"
    if (verify){
    const users = await db.query("SELECT id, email, username, role FROM public.users");        
    const users_online = []
    for(const obj of users.rows){
      const id= obj.id       
      const status_red = await redis.get(id)
      if(status_red == null){
          users_online.push({ ...obj, status: "offline"})
      }
      else{
         users_online.push({ ...obj, status: status_red})
      }
    }
    res.json(users_online);  
    }
    else {res.json('ACCESS DENIED')}
    }}
    catch(e){
      res.json({message: e})
    }
  }
 

  async get_total_users_count(req, res){
    try{
    const {token} = req.body
    const secret = process.env.SECRET_JWT;
    const decode = jwt.verify(token, secret)

    const verify = decode.role == "ADMIN"
    if (verify){
    const users = await db.query('SELECT "USERS_TOTAL" FROM global_info');    
    res.json(users.rows);
    }
    else {res.json('ACCESS DENIED')}
  }
    catch(e){
      res.json({message: e})
    }
  }

  async get_perday_users_count(req, res){
    try{
    const {token} = req.body
    const secret = process.env.SECRET_JWT;
    const decode = jwt.verify(token, secret)
    const verify = decode.role == "ADMIN"
    if (verify){
    const users =  await redis.get('users_per_day');   
    if (!users){
      try {
        const users_pg = await db.query('SELECT "USERS_PER_DAY" FROM global_info');
        return res.json(users_pg.rows);
      } catch (error) {
        console.log(error)
      }
    }
    res.json([{"USERS_PER_DAY" : users}]);
    }
    else {res.json('ACCESS DENIED')}
  }
  catch(e){
    res.json({message: e})
  }
  }


/////-------------------------------------------------------------------------
  async set_status_online(req, res){
      const {id} = req.body
      const response = await redis.set(id, 'online')
      res.json("ok")
  }


  async get_status_online(req, res){    
    try {
      //// update users from table with only 10 for req
      const idList = req.body
      const users_online = []
    for(const obj of idList){
      const id= obj.id
      const responce = await redis.get(id)
      if(responce == null){
        users_online.push({id, responce: "offline"})
      }
      else{
      users_online.push({id, responce})
      }
    }
      res.json(users_online)
    } catch (error) {
      res.json(error)
    }    
  }


  async get_last_online(req, res){
    const {token} = req.body
    const secret = process.env.SECRET_JWT;
    const decode = jwt.verify(token, secret)
    const verify = decode.role == "ADMIN"
    if (verify){
      /// set hourly
      const count = await db.query('SELECT "USERS_ONLINE_LAST_WEEK" FROM global_info')
      res.json(count.rows[0])
    }else{
      res.json({message: 'access denied'})
    }
  } 


  async get_last_registered(req, res){
    const {token} = req.body
    const secret = process.env.SECRET_JWT;
    const decode = jwt.verify(token, secret)
    const verify = decode.role == "ADMIN"
    if (verify){
    /// set hourly
    const count = await db.query('SELECT "USERS_REGISTERED_PER_WEEK" FROM global_info')
    res.json(count.rows[0])
    }else{
      res.json({message: 'access denied'})
    }
}

  
}
module.exports = new UserController();
