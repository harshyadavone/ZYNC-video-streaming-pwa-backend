// // Notification Routes
// router.get('/notifications', getNotifications);
// router.get('/notifications/:notificationId', getNotificationById);
// router.post('/notifications/:notificationId/markAsRead', markNotificationAsRead);
// router.post('/notifications/:notificationId/markAsUnread', markNotificationAsUnread);
// 


// 1. Noticlass NotificationService {
//     async createNotification(userId: number, type: NotificationType, message: string) {
//       // Create a new notification in the database
//       const notification = await prisma.notification.create({
//         data: {
//           userId,
//           type,
//           message,
//           status: 'UNREAD'
//         }
//       });
//       return  }
  
//     async getUserNotifications(userId: number) {
//       // Fetch user's notifications
//       return await prisma.notification.findMany({
//         where: { userId },
//         orderBy: { createdAt: 'desc' }
//       });
//     }
  
//     async markNotificationAsRead(notificationId: number) {
//       // Mark a notification as read
//       return await prisma.notification.update({
//         where: { id: notificationId },
//         data: { status: 'READ' }
//       });
//     }
//   }
  
//   // 2. Event Emitter Service
//   import { EventEmitter } from 'events';
  
//   class NotificationEventEmitter extends EventEmitter {
//     emitNewUpload(videoId: number, channelId: number) {
//       this.emit('newUpload', { videoId, channelId });
//     }
  
//     emitNewComment(commentId: number, videoId: number) {
//       this.emit('newComment', { commentId, videoId });
//     }
  
//     emitNewLike(videoId: number) {
//       this.emit('newLike', { videoId });
//     }
  
//     emitNewSubscription(channelId: number, subscriberId: number) {
//       this.emit('newSubscription', { channelId, subscriberId });
//     }
//   }
  
//   const notificationEventEmitter = new NotificationEventEmitter();
  
//   // 3. Notification Handler Service
//   class NotificationHandlerService {
//     constructor(private notificationService: NotificationService) {
//       this.setupEventListeners();
//     }
  
//     private setupEventListeners() {
//       notificationEventEmitter.on('newUpload', this.handleNewUpload.bind(this));
//       notificationEventEmitter.on('newComment', this.handleNewComment.bind(this));
//       notificationEventEmitter.on('newLike', this.handleNewLike.bind(this));
//       notificationEventEmitter.on('newSubscription', this.handleNewSubscription.bind(this));
//     }
  
//     private async handleNewUpload({ videoId, channelId }) {
//       const subscribers = await this.getChannelSubscribers(channelId);
//       for (const subscriber of subscribers) {
//         await this.notificationService.createNotification(
//           subscriber.id,
//           'NEW_UPLOAD',
//           `A new video has been uploaded to a channel you're subscribed       );
//       }
//     }
  
//     private async handleNewComment({ commentId, videoId }) {
//       const videoOwner = await this.getVideoOwner(videoId);
//       await this.notificationService.createNotification(
//         videoOwner.id,
//         'COMMENT',
//         `Someone commented on your video.`
//       );
//     }
  
//     private async handleNewLike({ videoId }) {
//       const videoOwner = await this.getVideoOwner(videoId);
//       await this.notificationService.createNotification(
//         videoOwner.id,
//         'LIKE',
//         `Someone liked your video.`
//       );
//     }
  
//     private async handleNewSubscription({ channelId, subscriberId }) {
//       const channelOwner = await this.getChannelOwner(channelId);
//       await this.notificationService.createNotification(
//         channelOwner.id,
//         'SUBSCRIPTION',
//         `You have a new subscriber!`
//       );
//     }
  
//     // Helper methods to fetch related data (implement these based on your data access layer)
//     private async getChannelSubscribers(channelId: number) {
//       // Fetch subscribers for a channel
//     }
  
//     private async getVideoOwner(videoId: number) {
//       // Fetch the owner of a video
//     }
  
//     private async getChannelOwner(channelId: number) {
//       // Fetch the owner of a channel
//     }
//   }
  
//   // 4. Usage in your application
//   const notificationService = new NotificationService();
//   const notificationHandler = new NotificationHandlerService(notificationService);
  
//   // Example: Emitting an event when a new video is uploaded
//   async function handleVideoUpload(videoData) {
//     // ... process video upload
//     const newVideo = await createVideo(videoData);
//     notificationEventEmitter.emitNewUpload(newVideo.id, newVideo.channelId);
//   }
  
//   // Example: Fetching user notifications
//   async function getUserNotifications(userId: number) {
//     return await notificationService.getUserNotifications(userId);
//   }
  
//   // Example: Marking a notification as read
//   async function markNotificationAsRead(notificationId: number) {
//     return await notificationService.markNotificationAsRead(notificationId);
//   }
  