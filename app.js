import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { type } from 'node:os';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'url'
const app = express();
const server = createServer(app);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Image/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/Image', express.static(path.join(__dirname, 'Image')));

app.use(cors());
app.use(express.json());

// mongoose.connect('mongodb://localhost:27017/cyberForum')
mongoose.connect('mongodb://127.0.0.1:27017/cyberForum')
  .then(() => console.log("Connected to yourDB-name database"))
  .catch((err) => console.log(err));



const Post = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  title: { type: String },
  description: { type: String },
  datePublication: { type: String, default: Date.now() },
  image: { type: String },
  datePublication: { type: Date, default: Date.now() },
  likesCount: { type: Number, default: 0 },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "tags" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comments" }],
  likePosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "likePosts" }],
})

const User = mongoose.Schema({
  avatar: {
    type: String,
    required: false // Или true, если аватар обязателен
  },
  userName: {
    type: String,
    required: true,
    unique: true // Предполагая, что имя пользователя должно быть уникальным
  },
  password: {
    type: String,
    required: false
  },
  quote: {
    type: String,
    required: false
  },
  firstName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: false
  },
  middleName: {
    type: String,
    required: false // Если среднее имя не является обязательным
  },
  phone: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: false
  },
  about: {
    type: String,
    required: false // Можно добавить ограничение на длину, если нужно
  },
  email: {
    type: String,
    required: false,
    unique: true, // Предполагая, что email должен быть уникальным
    match: /.+\@.+\..+/ // Обычное выражение для проверки формата email
  },
  tags: {
    type: [String],
    default: []
  },
  likePosts: [{ // Добавляем поле для связи с постами
    type: mongoose.Schema.Types.ObjectId,
    ref: 'likePosts' // Ссылка на модель Post
  }],
  likeComments: [{ // Добавляем поле для связи с постами
    type: mongoose.Schema.Types.ObjectId,
    ref: 'likeComments' // Ссылка на модель Post
  }],
  posts: [{ // Добавляем поле для связи с постами
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post' // Ссылка на модель Post
  }]
});

const Tag = mongoose.Schema({
  tag: {
    type: String,
    unique: true,
  },
  tagCount: { type: Number }
})

const Comment = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "posts" },
  image: {
    type: String,
    required: false
  },
  text: { type: String, required: true },
  datePublication: { type: String },
  likesCount: { type: Number, default: 0 },
  likeComments: [{ type: mongoose.Schema.Types.ObjectId, ref: "likeComments" }]
})

const LikePost = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "posts" },

})

const LikeComment = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: "comments" },

})

export const Posts = mongoose.model('posts', Post)

export const Users = mongoose.model('users', User);

export const Tagss = mongoose.model('tags', Tag);

export const Comments = mongoose.model('comments', Comment);

export const LikePosts = mongoose.model('likePosts', LikePost);

export const LikeComments = mongoose.model('likeComments', LikeComment);


app.get('/api/post/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // if (req.file) {
    //   updateData.avatar = `Image/${req.file.filename}`;
    // }
    // Поиск поста в базе данных с его отношениями
    const post = await Posts.findById(id)
      .populate({
        path: 'author', // Подгрузка пользователя
        select: 'avatar userName', // Выбираем только аватар и имя пользователя
      })
      .populate({
        path: 'comments', // Подгрузка комментариев
        populate: {
          path: 'author', // Также подгружаем пользователей из комментариев
          select: 'userName avatar'
        },
      })
      .populate({
        path: 'tags', // Подгрузка тегов
        select: 'tag',
      })
      .exec();

    if (!post) {
      return res.status(404).json({ message: "Пост не найден" });
    }
    // console.log(post);
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.post('/api/login', async (req, res) => {
  const { userName, password } = req.body;
  const user = await Users.findOne({ userName });

  if (!user) {
    return res.status(400).json({ message: 'Пользователь не найден.' });
  } else if (user && password == user.password) {
    res.json(user);
  } else {
    return res.status(400).json({ message: 'Неверный пароль.' });
  }
});

app.get('/api/getPostsWithParams', async (req, res) => {
  try {
    const { title, author, sort, tags } = req.query;
    console.log('kl', req.query);

    // Создаем базовый запрос
    let query = Posts.find();

    // Фильтрация по заголовку
    if (title) {
      query = query.where('title').regex(new RegExp(title, 'i'));
    }

    // Фильтрация по автору
    if (author) {
      console.log('author', author);
      const users = await Users.find({
        userName: { $regex: new RegExp(author, 'i') }
      });
      console.log('users', users);
      const userIds = users.map(user => user._id);
      query = query.where('author').in(userIds);
    }

    // Фильтрация по тегам
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');

      // Получаем _id для каждого тега
      const tagDocs = await Tagss.find({ tag: { $in: tagsArray } }).select('_id').exec();
      console.log('karp', tagDocs);
      const tagIds = tagDocs.map(tag => tag._id); // Получаем массив _id тегов

      // Теперь используем _id для запроса
      query = query.where('tags').all(tagIds);
    }

    // Сортировка
    const sortOrder = sort === 'desc' ? -1 : 1;
    query = query.sort({ createdAt: sortOrder });

    // Выполняем запрос
    const posts = await query.exec();

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/getPost', async (req, res) => {
  // const post = req.query;
  const post = await Posts.find();
  res.json(post);
})

app.get('/api/getTags', async (req, res) => {
  // const post = req.query;
  const tags = await Tagss.find();
  res.json(tags);
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

app.post("/api/post/:_id/comment", async (req, res) => {
  try {
    const postId = req.params._id;
    const { text, idUser } = req.body;

    console.log(idUser, "id user");
    if (!text) {
      return res.status(400).json({ message: "Комментарий не может быть пустым" });
    }

    const timestamp = 1743767934054; // метка времени в миллисекундах
    const date = new Date(timestamp); // конвертация в объект даты

    // получение дня, месяца и года
    const day = date.getDate().toString().padStart(2, '0'); // добавляем ведущий ноль
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // месяцы начинаются с 0, поэтому +1
    const year = date.getFullYear();

    // формируем строку в формате "дд-мм-гггг"
    const formattedDate = `${day}-${month}-${year}`;

    const newComment = new Comments({
      post: postId,
      text,
      author: idUser,
      datePublication: formattedDate,
      // Текст комментария из запроса
    });

    const savedComment = await newComment.save();

    // Теперь обновим пост, добавив ссылку на комментарий
    const post = await Posts.findById(postId);
    console.log(post);
    post.comments.push(savedComment._id);
    await post.save();

    const populatedComment = await Comments.findById(savedComment._id)
      .populate({
        path: 'author', // Подгрузка комментариев

        select: 'userName avatar'

      }).populate('')
    // .populate('author')
    // .populate('post');
    // const user = await Users.findById(idUser);
    // console.log(user);
    // user.comments.push(savedComment._id);
    // await user.save();

    // res.status(201).json(savedComment); // Отправляем сохраненный комментарий обратно клиенту
    res.status(201).json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при добавлении комментария" });
  }
});

app.post("/api/post/:_id/likeComment", async (req, res) => {
  // сделать post запрос который получает id usera и posta, записывает в таблицу likePost нровую запись и перещитывает в  таблице Post количество лайков
  try {
    const postId = req.params._id;
    const { idUser, idComment } = req.body;

    const user = await Users.findById(idUser).populate('likeComments');
    console.log("fffffffffffffddd");
    // console.log(user.likePosts.user, "user.likePosts.user");
    console.log(idUser, "idUser");
    // const post = await Posts.findById(postId).populate('comments').populate('likeComments');
    // const post = await Posts.findById(postId).populate({path:'comments',populate:{path:'likeComments'})});

    const comments = await Comments.find({ post: postId });

    // Составляем массив ID всех комментариев
    const commentIds = comments.map((comment) => comment._id);

    // Ищем лайки для этих комментариев
    const likes = await LikeComments.find({
      comment: { $in: commentIds },
    });

    const currentComment = await Comments.findOne({ _id: idComment });
    console.log(currentComment," ddddddddddssssssssssss");

    if (likes.some(post => post.user == idUser)) {
      console.log("ID найден!");
    } else {
      console.log("ID не найден.");
      console.log("tttttttttttttttttttfffftt.");
      const newComment = new LikeComments({
        comment: postId,//gggggggggggggggg
        user: idUser,
      });
      console.log("ttttttttttttttttttttt.");
      const savedComment = await newComment.save();
      
      user.likeComments.push(savedComment._id);
      await user.save();
      // post.likeComments.push(savedComment._id);
      
      // post.likesCount++;
      // await post.save();
      res.status(201).json(likes.likesCount);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при добавлении комментария" });
  }
});

app.post("/api/post/:_id/likePost", async (req, res) => {
  // сделать post запрос который получает id usera и posta, записывает в таблицу likePost нровую запись и перещитывает в  таблице Post количество лайков
  try {
    const postId = req.params._id;
    const { idUser } = req.body;

    
    const user = await Users.findById(idUser).populate('likePosts');
    console.log("fffffffffffff");
    // console.log(user.likePosts.user, "user.likePosts.user");
    console.log(idUser, "idUser");
    const post = await Posts.findById(postId).populate('likePosts');
    
    if (post.likePosts.some(post => post.user == idUser)) {
      console.log("ID найден!");
    } else {
      console.log("ID не найден.");
      
      const newLike = new LikePosts({
        post: postId,
        user: idUser,
      });
      const savedLike = await newLike.save();
      
      user.likePosts.push(savedLike._id);
      await user.save();
      post.likePosts.push(savedLike._id);
      
      post.likesCount++;
      await post.save();
      res.status(201).json(post.likesCount);
    }
    
    // const count = await LikePosts.countDocuments({ user: idUser });
    // console.log(count,"count");

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при добавлении комментария" });
  }
});

app.get("/api/post/:_id/getLikePost", async (req, res) => {
  // сделать post запрос который получает id usera и posta, записывает в таблицу likePost нровую запись и перещитывает в  таблице Post количество лайков
  try {
    const postId = req.params._id;

    const post = await Posts.findById(postId)
    console.log("--------------------");
    res.status(201).json(post.likesCount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при добавлении комментария" });
  }
});

app.post("/api/createPost", upload.single('image'), async (req, res) => {
  try {
    const { title, content, image, tags, author } = req.body;
    console.log('req.body', req.body);
    console.log('file', req.file);
    // const userId = req.user._id; // Предполагаем аутентификацию

    // Парсинг и валидация тегов
    let parsedTags = [];
    try {
      parsedTags = JSON.parse(tags);
      if (!Array.isArray(parsedTags)) throw new Error();
    } catch {
      return res.status(400).send("Invalid tags format");
    }

    // Обработка тегов
    const tagIds = [];
    for (const tagName of parsedTags) {
      const normalizedTag = tagName.trim().toLowerCase();
      const tag = await Tagss.findOneAndUpdate(
        { tag: normalizedTag },
        { $inc: { tagCount: 1 } },
        { upsert: true, new: true }
      );
      tagIds.push(tag._id);
    }

    // Создание поста
    const newPost = new Posts({
      author,
      title,
      description: content,
      tags: tagIds,
      image: req.file ? `http://localhost:5000/uploads/posts/${req.file.filename}` : null,
      datePublication: new Date()
    });

    // Сохранение поста
    let savedPost = await newPost.save();

    // Обновление пользователя
    await Users.findByIdAndUpdate(author, {
      $push: { posts: savedPost._id } //нужно ли менять _id на author?
    });

    // Получение полного объекта с populate
    const populatedPost = await Posts.findById(savedPost._id)
      .populate('author')
      .populate('tags');

    res.status(201).json(populatedPost);

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Something Went Wrong");
  }
});

// PATCH endpoint to update user
// PATCH endpoint to update user with image upload
app.patch('/api/changeuser/:id', upload.single('avatar'), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
 
    if (req.file) {
      updateData.avatar = `Image/${req.file.filename}`;
    }
    
    if (updateData.tags) {
      try {
        

        console.log(updateData.tags);
        updateData.tags = updateData.tags.split(',').map(item => item.trim());
       
      } catch (error) {
        return res.status(400).json({ error: 'Invalid tags format' });
      }
    }
    const updatedUser = await Users.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, 
        runValidators: true 
      }
    );
    if (!updatedUser) {
      return res.status(404).send('User not found');
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Server error');
  }
});




const PORT = 5000;

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});