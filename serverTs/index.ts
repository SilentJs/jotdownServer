import bodyParser from 'body-parser';
import express, { Request, Response, response } from 'express';
import cors from 'cors';
import { credentialsJson, order } from './interface';
import databaseClient from './database';
import Razorpay from 'razorpay';
import multer from 'multer';
import path from 'path';
import fs from 'fs'
import { superLongUUID } from './utility';

// import './database'

export const app = express();
const port = 4000;
export const storeClient = new databaseClient('jotdown')
var currentFileName=''
import './credentialStore'

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express with TypeScript!');
});
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,  // Enable credentials (cookies, authorization headers, etc.)
}));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.post('/api', (req, res) => {
  const jsonData = req.body;
  // res.send("Sucessful post request")
  // Process and store jsonData as needed
  console.log('Received JSON data:', jsonData);
  res.json({"niga":"yes","huh":"nigga"})

  // Send a response
  // res.status(500).json({ message: 'Data stored successfully' });
});
const razorpay = new Razorpay({
  key_id: 'rzp_test_7lzt9XHzGCDSqY',
  key_secret: 'XsLDUWPuRDWjeeMaSXcdIx9I',
});

app.post('/create-order', async (req, res) => {     
  const { amount, currency = 'INR' } = req.body;
  console.log('order-created')

  try {
    const options = {
      amount: (parseInt(amount)+70) * 100,
      currency,
      receipt: 'order_receipt',
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/orderCheck', (req, res) => {
  const jsonData:order = req.body;
  // console.log(jsonData)
  // res.send("Sucessful post request")
  // Process and store jsonData as needed
  storeClient.buy(jsonData).then(()=>res.json({'ORDER':"SUCCESS"}),()=>res.json({'ORDER':'FAILED'}))
  // console.log('Received JSON data:', jsonData);
  // Send a response
  // res.status(500).json({ message: 'Data stored successfully' });
});
app.post('/profileOrderStore',(req,res)=>{
  const jsonData = req.body
  storeClient.checkForOrders(jsonData.id).then(r=>res.json(r),x=>res.json(x))
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define the destination directory where files will be stored
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    var fileName = Date.now() +superLongUUID() + path.extname(file.originalname)
    // Define the file name for the uploaded file
    cb(null, fileName );
    currentFileName=fileName
  }
});

// Create multer instance with the storage options
const upload = multer({ storage: storage,limits:{fileSize:40*1024*1024} });

// Define a POST route to handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('File reCIEVAEVJAVA')
  // If file is successfully uploaded, multer adds it to req.file
  const file = req.file as Express.Multer.File;
  if (!file) {
    // If no file is received, send a 400 status code with an error message
    return res.status(400).send('No file uploaded.');
  }
  // If file is received, send a success response with file details
  res.send({uploadName:file.originalname,serverName:currentFileName});
});
app.get('/download/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, '../uploads/', fileName);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  // Set headers to specify the file type and attachment disposition
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  // Create a read stream from the file and pipe it to the response
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});
app.use((err:any, req:any, res:any, next:any) => {
  console.log("FileSize Exceeded")
  if (err instanceof multer.MulterError) {
    // Handle multer errors, such as file size limit exceeded
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send({uploadName:'ERROR'});
    }
    // Handle other multer errors if needed
    // For example: res.status(500).send('Multer error: ' + err.message);
  }
  // Forward other errors to the next middleware
  next(err);
});
// Start the server
