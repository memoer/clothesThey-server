import Post from 'models/Post';
import User from 'models/User';
import Generaterr from 'generaterr';

export const read = async (req, res) => {
  const {
    query: { page },
    params: { category },
  } = req;
  const LIMIT_PAGE = 10;
  try {
    const posts =
      category === 'me'
        ? (await User.findById(req.user._id).populate({
            path: 'posts',
            options: {
              limit: LIMIT_PAGE,
              sort: { createdAt: -1 },
              skip: (parseInt(page || 1, 10) - 1) * LIMIT_PAGE,
            },
          })).posts
        : await Post.find({ category })
            .populate({ path: 'creator', select: 'nickname' })
            .sort({ createdAt: -1 })
            .limit(LIMIT_PAGE)
            .skip((parseInt(page || 1, 10) - 1) * LIMIT_PAGE);
    return res.status(200).json(posts);
  } catch (e) {
    console.log(e);
    return res.status(500).end();
  }
};

export const create = async (req, res) => {
  const {
    body: { title, content, category },
    file: { location },
  } = req;
  try {
    const newPost = await Post.create({
      category,
      title,
      content,
      imageUrl: location,
      creator: req.user.id,
    });
    req.user.posts.push(newPost.id);
    req.user.save();
    res.status(200).json(newPost);
  } catch (e) {
    console.log(e);
    res.status(500).end();
  }
};

export const deletePost = async (req, res) => {
  const {
    body: { id },
  } = req;
  try {
    await Post.findByIdAndRemove(id);
    req.user.posts.remove(id);
    req.user.save();
    return res.status(204).end();
  } catch (e) {
    console.log(e);
    return res.status(500).end();
  }
};

export const updatePost = async (req, res) => {
  const {
    body: { id, title, content },
    file: { location },
  } = req;
  try {
    const post = await Post.findById(id);
    post.title = title;
    post.content = content;
    post.imageUrl = location;
    post.save();
    return res.status(200).json(post);
  } catch (e) {
    console.log(e);
    return res.status(500).end();
  }
};

export const addLike = async (req, res) => {
  const {
    params: { id },
  } = req;
  try {
    const post = await Post.findById(id);
    post.like.push(req.user.id);
    post.save();
    return res.status(200).end();
  } catch (e) {
    console.log(e);
    return res.status(500).end();
  }
};

export const onlyMe = async (req, res, next) => {
  const {
    body: { id },
  } = req;
  try {
    const post = await Post.findById(id);
    if (String(post.creator) !== req.user.id) {
      console.log(new Generaterr('not post i created'));
      return res.status(401).end();
    }
    return next();
  } catch (e) {
    console.log(e);
    return res.status(500).end();
  }
};

export const getLength = async (req, res) => {
  const {
    params: { category },
  } = req;
  try {
    const post = await Post.find({ category });
    return res.status(200).json(post.length);
  } catch (e) {
    console.log(e);
    return res.status(500).end(e.message);
  }
};
