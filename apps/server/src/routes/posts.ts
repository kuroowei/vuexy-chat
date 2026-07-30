import { Router, Response } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Post } from '../models/Post';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import cloudinary from '../config/cloudinary';

const router = Router();

router.use(authMiddleware);

// Multer + Cloudinary configuration for post images
const postImageStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'chat-app-posts',
    resource_type: 'image',
  }),
});

const uploadPostImage = multer({
  storage: postImageStorage,
  fileFilter: (req: any, file: any, cb: any) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const toAuthorSummary = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  avatar: user.avatar || '',
});

const toPostResponse = (post: any, currentUserId: string) => ({
  id: post._id.toString(),
  author: toAuthorSummary(post.authorId),
  content: post.content,
  imageUrl: post.imageUrl,
  likeCount: post.likes.length,
  likedByMe: post.likes.some((id: any) => id.toString() === currentUserId),
  comments: post.comments.map((c: any) => ({
    id: c._id.toString(),
    author: toAuthorSummary(c.authorId),
    text: c.text,
    createdAt: c.createdAt,
  })),
  createdAt: post.createdAt,
});

// GET /api/posts — public feed, newest first
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('authorId', 'name avatar')
      .populate('comments.authorId', 'name avatar');

    res.json({ posts: posts.map((p) => toPostResponse(p, userId)) });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts — create a post (text and/or image)
router.post('/', uploadPostImage.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { content } = req.body;
    const imageUrl = req.file ? (req.file as any).path : undefined;

    if ((!content || !content.trim()) && !imageUrl) {
      return res.status(400).json({ message: 'Post must have text or an image' });
    }

    let post: any = await Post.create({
      authorId: userId,
      content: content ? content.trim() : '',
      imageUrl,
    });

    post = await post.populate('authorId', 'name avatar');

    res.status(201).json({ post: toPostResponse(post, userId) });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/like — toggle like
router.post('/:id/like', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.some((id: any) => id.toString() === userId);
    if (alreadyLiked) {
      post.likes = post.likes.filter((id: any) => id.toString() !== userId) as any;
    } else {
      post.likes.push(userId as any);
    }
    await post.save();

    res.json({ likeCount: post.likes.length, likedByMe: !alreadyLiked });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post: any = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ authorId: userId, text: text.trim() });
    await post.save();
    await post.populate('comments.authorId', 'name avatar');

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({
      comment: {
        id: newComment._id.toString(),
        author: toAuthorSummary(newComment.authorId),
        text: newComment.text,
        createdAt: newComment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id — author only
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.authorId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;