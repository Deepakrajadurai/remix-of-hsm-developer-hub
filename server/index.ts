/**
 * Express Server for MySQL Backend
 * 
 * This server replaces Supabase backend functionality with Express + Prisma
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// POSTS API
// ============================================

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const { channelId } = req.query;

        const posts = await prisma.post.findMany({
            where: channelId ? { channelId: channelId as string } : undefined,
            include: {
                author: {
                    include: {
                        profile: true,
                    },
                },
                comments: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
                postLikes: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Create a post
app.post('/api/posts', async (req, res) => {
    try {
        const { authorId, authorName, authorAvatar, content, channelId, imageUrl } = req.body;

        const post = await prisma.post.create({
            data: {
                authorId,
                authorName,
                authorAvatar,
                content,
                channelId,
                imageUrl,
            },
            include: {
                author: true,
            },
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Like a post
app.post('/api/posts/:postId/like', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        const like = await prisma.postLike.create({
            data: {
                postId,
                userId,
            },
        });

        // Update likes count
        await prisma.post.update({
            where: { id: postId },
            data: {
                likes: {
                    increment: 1,
                },
            },
        });

        res.status(201).json(like);
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Unlike a post
app.delete('/api/posts/:postId/like', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        await prisma.postLike.delete({
            where: {
                postId_userId: {
                    postId,
                    userId,
                },
            },
        });

        // Update likes count
        await prisma.post.update({
            where: { id: postId },
            data: {
                likes: {
                    decrement: 1,
                },
            },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error unliking post:', error);
        res.status(500).json({ error: 'Failed to unlike post' });
    }
});

// ============================================
// COMMENTS API
// ============================================

// Get comments for a post
app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;

        const comments = await prisma.comment.findMany({
            where: { postId },
            include: {
                user: {
                    include: {
                        profile: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create a comment
app.post('/api/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, userName, userAvatar, content } = req.body;

        const comment = await prisma.comment.create({
            data: {
                postId,
                userId,
                userName,
                userAvatar,
                content,
            },
        });

        // Update comments count
        await prisma.post.update({
            where: { id: postId },
            data: {
                commentsCount: {
                    increment: 1,
                },
            },
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// ============================================
// EVENTS API
// ============================================

// Get all events
app.get('/api/events', async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            include: {
                registrations: true,
            },
            orderBy: {
                eventDate: 'asc',
            },
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create event registration
app.post('/api/events/:eventId/register', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { userId, firstName, lastName, email, attendeesCount } = req.body;

        const registration = await prisma.eventRegistration.create({
            data: {
                eventId,
                userId,
                firstName,
                lastName,
                email,
                attendeesCount: attendeesCount || 1,
            },
        });

        res.status(201).json(registration);
    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({ error: 'Failed to create registration' });
    }
});

// ============================================
// CHANNELS API
// ============================================

// Get all channels
app.get('/api/channels', async (req, res) => {
    try {
        const channels = await prisma.channel.findMany({
            orderBy: {
                createdAt: 'asc',
            },
        });

        res.json(channels);
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

// ============================================
// CHAT MESSAGES API
// ============================================

// Get messages for a channel
app.get('/api/channels/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;

        const messages = await prisma.chatMessage.findMany({
            where: { channelId },
            include: {
                user: {
                    include: {
                        profile: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: 100, // Limit to last 100 messages
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send a message
app.post('/api/channels/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId, userName, userAvatar, message } = req.body;

        const chatMessage = await prisma.chatMessage.create({
            data: {
                channelId,
                userId,
                userName,
                userAvatar,
                message,
            },
        });

        res.status(201).json(chatMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});
