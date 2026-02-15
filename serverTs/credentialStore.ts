import bodyParser, { json } from "body-parser";
import { app, storeClient } from ".";
import { credentialsJson, tokenJson } from "./interface";
import cors from "cors";
import JwtHandler from "./jwt";
const tokenHandler = new JwtHandler('85hKkaj0dfHAk5rGL6YuhHRhJc8ofaWj')

app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,  // Enable credentials (cookies, authorization headers, etc.)
}));
app.post('/adviewaccesible', (req, res) => {               //adviewaccessible is to ceheck orders on server
  const jsonData:credentialsJson = req.body;
  // Process and store jsonData as needed
  // console.log('[ADMIN]:', jsonData);
  if(jsonData.type==='admin'){
    storeClient.adminCredentialsCheck().then(r=>r.forEach((x:credentialsJson)=>{
      if(x.username===jsonData.username && x.password===jsonData.password){
        var token
        if(jsonData.username) token=tokenHandler.generateToken({userId:jsonData.username},'6h')
        res.send({jwtToken:token})
      }else{
        res.status(401).send("Invalid Credentials")
      }
    }))
  }else if(jsonData.type==='jwtToken'){
    if(tokenHandler.verifyToken(jsonData.password)===null){res.status(401).send("Invalid Token");return;}
    res.send('200 OK')
  }else if(jsonData.type==='writer'){
    storeClient.writerCredentialsCheck().then(r=>r.forEach((x:credentialsJson)=>{
      if(x.username===jsonData.username && x.password===jsonData.password){
        var token
        if(jsonData.username) token=tokenHandler.generateToken({userId:jsonData.username},'6h')
        res.send({jwtToken:token,uuid:x.uuid})
      }else{
        res.status(401).send("Invalid Credentials")
      }
    }))
  }
  
  // Send a response
  // res.status(500).json({ message: 'Data stored successfully' });
});
app.post('/nonadviewaccesible', (req, res) => {            //nonadviewaccessible is to pull orders from server
  const jsonData:credentialsJson = req.body;
  // Process and store jsonData as needed
  // console.log('[ADMIN]:', jsonData);
  if(jsonData.type==='admin'){
    if(tokenHandler.verifyToken(jsonData.password)===null){res.status(401).send("Invalid Token");return;}
    storeClient.adminOrders(jsonData).then(r=>res.json(r),x=>res.json(x))
  }else if(jsonData.type==='jwtToken'){
    if(tokenHandler.verifyToken(jsonData.password)===null){res.status(401).send("Invalid Token");return;}
    res.send('200 OK')
  }else if(jsonData.type==='writer'){
    console.log(jsonData)
    if(tokenHandler.verifyToken(jsonData.password)===null){res.status(401).send("Invalid Token");return;}
    storeClient.writerOrders(jsonData).then(r=>res.json(r),x=>res.json(x))
  }
  
  // Send a response
  // res.status(500).json({ message: 'Data stored successfully' });
});

// app.post('/adminOrderStore',(req,res)=>{
//   const jsonData:tokenJson = req.body
//   if(tokenHandler.verifyToken(jsonData.jwtToken)===null){res.status(401).send("Invalid Token");return;}
//   storeClient.adminOrders(jsonData).then(r=>res.json(r),x=>res.json(x))
// })
app.post('/adminPanelStore',(req,res)=>{
  const jsonData:tokenJson = req.body
  if(tokenHandler.verifyToken(jsonData.jwtToken)===null){res.status(401).send("Invalid Token");return;}
  if(jsonData.settings.action==='WA'){
    storeClient.writerAssign(jsonData.settings?.orderId,jsonData.settings?.writerId);
  }
  else if(jsonData.settings.action==='WDA'){
    storeClient.writerDeAssign (jsonData.settings?.orderId,jsonData.settings?.writerId);
  }
      
  res.send({response:"OK"})
  console.log(jsonData)

  // storeClient.adminOrders().then(r=>res.json(r),x=>res.json(x))
})

// Start the server
