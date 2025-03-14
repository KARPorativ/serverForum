import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { type } from 'node:os';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import {fileURLToPath} from 'url'
const app = express();
const server = createServer(app);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage })
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 
app.use(cors());
app.use(express.json());
 
mongoose.connect('mongodb://localhost:27017/cyberForum')
.then(() => console.log("Connected to yourDB-name database"))
.catch((err) => console.log(err));
 
const Post = mongoose.Schema({
  user:{type: mongoose.Schema.Types.ObjectId, ref:"users"},
  title: {type: String},
  description: {type: String},
  datePublication:{type:String},
  tags: [{type: mongoose.Schema.Types.ObjectId, ref:"tags"}],
  comments: [{type: mongoose.Schema.Types.ObjectId, ref:"comments"}],
})
 
const User = mongoose.Schema({
  userName: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  password:{type: String, required: true},
  admin: {type: Boolean, default: false},
  image: {type: String},
  // posts: [{type: mongoose.Schema.Types.ObjectId, ref:"post"}]
}) 
 
export const Posts = mongoose.model('posts', Post)
 
export const Users = mongoose.model('users', User);
 
// app.get('/', (req, res) => {
//   res.send('<h1>Hello world</h1>');
// });

// app.get("/api/getUser", ({ query: { login, password } }, res) => {
//   Users.findOne({ login, password }).then((user) => {
//     if (user !== null) {
//       res.json(user);
//       // console.log(user)
//       // res.json(true);
//     } else {
//       res.json(false);
//     }
//   });
//   console.log(login, password);
// });
app.post('/api/login', async (req, res) => {
  const { userName, password } = req.body;
  const user = await Users.findOne({ userName });

  if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден.' });
  }else if(user && password == user.password){
    res.json(user);
  }else{
    return res.status(400).json({ message: 'Неверный пароль.' });
  }

  // const isMatch = await bcrypt.compare(password, user.password);

  // if (!isMatch) {
  //     return res.status(400).json({ message: 'Неверный пароль.' });
  // }else{
  //   res.json(user);
  // }

  // const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
  // res.json({ token });
}); 

app.get('/api/getPost', async(req, res) => {
  // const post = req.query;
  const post = await Posts.find();
  res.json(post);
})




// Эндпоинт для регистрации пользователя
app.post('/api/register', async (req, res) => {
  const { userName, email, password } = req.body;
  
  // Проверяем переданные данные
  if (!userName || !password || !email) {
    return res.status(400).json({ error: 'Пожалуйста, предоставьте имя пользователя, email и пароль.' });
  }

  // Проверяем, существует ли уже пользователь с таким именем
  const existingUser = await Users.findOne({ userName });
  if (existingUser) {
    return res.status(400).json({ error: 'Пользователь с таким именем уже существует.' });
  }

  // Создаем нового пользователя
  const newUser = new Users({ userName, email, password });
  await newUser.save();
  
  console.log('Пользователь зарегистрирован успешно.')
  return res.status(201).json({ message: 'Пользователь зарегистрирован успешно.' });
});

app.post("/api/addPost", upload.single('image'), async (req, res) => {
  try {
    console.log('post')
    console.log('fgld', req.body)
    const smens = new Posts(req.body);
    console.log("smens", smens);
    let result = await smens.save();
    result = result.toObject();

    // Теперь используем метод populate для заполнения пользователя
    const populatedResult = await Smens.findById(result._id).populate('user');

    if (populatedResult) {
      res.send(populatedResult);
      console.log('result', populatedResult);
    } else {
      console.log("Posts already registered");
    }
  } catch (e) {
    res.send("Something Went Wrong");
  }

});
 
const PORT = 5000;
 
server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});