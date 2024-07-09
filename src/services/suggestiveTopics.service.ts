// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function getSuggestedTopics(userId) {
//   // Fetch the user's interests
//   const userInterests = await prisma.userInterest.findMany({
//     where: { userId },
//     orderBy: { interestLevel: 'desc' },
//     take: 5,
//     include: { category: true },
//   });

//   // Fetch the user's watch history
//   const watchHistory = await prisma.watchHistory.findMany({
//     where: { userId },
//     orderBy: { updatedAt: 'desc' },
//     take: 10,
//     include: { video: { include: { category: true } } },
//   });

//   // Fetch the trending topics
//   const trendingTopics = await prisma.video.groupBy({
//     by: ['categoryId'],
//     where: {
//       createdAt: {
//         gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
//       },
//     },
//     _sum: {
//       views: true,
//     },
//     orderBy: {
//       _sum: {
//         views: 'desc',
//       },
//     },
//     take: 5,
//   });

//   // Combine the user's interests, watch history, and trending topics
//   const suggestedTopics = new Set();
//   userInterests.forEach((interest) => {
//     suggestedTopics.add(interest.category);
//   });
//   watchHistory.forEach((history) => {
//     suggestedTopics.add(history.video.category);
//   });
//   trendingTopics.forEach((topic) => {
//     suggestedTopics.add(topic.category);
//   });

//   // Fetch additional related topics
//   const relatedTopics = new Map();
//   for (const topic of suggestedTopics) {
//     const videos = await prisma.video.findMany({
//       where: { categoryId: topic.id },
//       include: { category: true },
//     });
//     const tags = new Map();
//     videos.forEach((video) => {
//       video.tags.forEach((tag) => {
//         tags.set(tag, (tags.get(tag) || 0) + 1);
//       });
//     });
//     const topTags = Array.from(tags.entries())
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 3)
//       .map((entry) => entry[0]);
//     relatedTopics.set(topic, topTags);
//   }

//   // Rank and diversify the suggested topics
//   const rankedTopics = Array.from(suggestedTopics).map((topic) => ({
//     topic,
//     score:
//       (userInterests.find((interest) => interest.categoryId === topic.id)
//         ?.interestLevel || 0) +
//       (watchHistory.filter((history) => history.video.categoryId === topic.id)
//         .length || 0) +
//       (trendingTopics.find((trendingTopic) => trendingTopic.categoryId === topic.id)
//         ?._sum.views || 0),
//   }));
//   rankedTopics.sort((a, b) => b.score - a.score);
//   const diversifiedTopics = [];
//   const categoryCount = new Map();
//   for (const rankedTopic of rankedTopics) {
//     const { topic } = rankedTopic;
//     const count = categoryCount.get(topic.id) || 0;
//     if (count < 2) {
//       diversifiedTopics.push(topic);
//       categoryCount.set(topic.id, count + 1);
//     }
//     if (diversifiedTopics.length >= 10) {
//       break;
//     }
//   }

//   // Cache and return the suggested topics
//   // Implement caching mechanism here (e.g., Redis, Memcached)
//   // For simplicity, we'll return the suggested topics directly
//   return diversifiedTopics.map((topic) => ({
//     ...topic,
//     relatedTopics: relatedTopics.get(topic),
//   }));
// }