import { Router } from 'express';

import { addVideoToPlaylist, createPlaylist, deletePlaylist, getChannelPlaylists, getPlaylistById, getUserPrivatePlaylists, isVideoInPlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controllers";

const playlistRouter = Router();

playlistRouter.post('/playlists', createPlaylist); // Create a new playlist
playlistRouter.put('/playlists/:id', updatePlaylist); // Update an existing playlist
playlistRouter.delete('/playlists/:id', deletePlaylist); // Delete a playlist
playlistRouter.post('/playlists/:playlistId/videos', addVideoToPlaylist); // Add a video to a playlist 
playlistRouter.delete('/playlists/:playlistId/videos/:videoId', removeVideoFromPlaylist); // Remove a video from a playlist
playlistRouter.get('/channels/:channelId/playlists', getChannelPlaylists); // Get all playlists of a channel
playlistRouter.get('/users/private-playlists', getUserPrivatePlaylists); // Get all private playlists of a user
playlistRouter.get('/playlists/:id', getPlaylistById); // Get a playlist by ID
playlistRouter.get('/:playlistId/has-video/:videoId', isVideoInPlaylist);


export default playlistRouter;