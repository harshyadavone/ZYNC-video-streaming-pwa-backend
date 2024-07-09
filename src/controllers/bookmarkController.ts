import {
  getBookmarkByIdService,
  getBookmarksService,
  getVideoBookmarksService,
  updateBookmarkStatusService,
} from "../services/bookmarkServices";
import catchErrors from "../utils/catchErrors";

export const getBookmarks = catchErrors(async (req, res) => {
  try {
    const { page, limit } = req.query;
    const userId = Number(req.userId); // Assuming you have authentication middleware
    const bookmarks = await getBookmarksService(
      userId,
      Number(page),
      Number(limit)
    );

    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookmarks", error });
  }
});

export const getBookmarkById = catchErrors(async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const bookmark = await getBookmarkByIdService(parseInt(bookmarkId));
    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    res.json(bookmark);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookmark", error });
  }
});
// export const updateBookmarkStatus = catchErrors(async (req, res) => {
//   try {
//     const { bookmarkId } = req.params;
//     const { status } = req.body;
//     const updatedBookmark = await updateBookmarkStatusService(
//       parseInt(bookmarkId),
//       status ? 
//     );
//     res.json(updatedBookmark);
//   } catch (error) {
//     res.status(500).json({ message: "Error updating bookmark status", error });
//   }
// });

export const getVideoBookmarks = catchErrors(async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = Number(req.userId); // Assuming you have authentication middleware
    const bookmarks = await getVideoBookmarksService(parseInt(videoId), userId);
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching video bookmarks", error });
  }
});
