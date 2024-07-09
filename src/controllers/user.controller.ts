import prisma from "../config/client";
import { BAD_REQUEST, NOT_FOUND, OK, UNAUTHORIZED } from "../constants/http";
import { updateUserProfile } from "../services/user.service";
import appAssert from "../utils/appAssert"; 
import catchErrors from "../utils/catchErrors";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { updateUserProfileSchema } from "../validations/user.validation";

// updated everything just run that command
// docker run --name postgres-container2 -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_USER=myuser -e POSTGRES_DB=mydatabase -p 5432:5432 -v postgres-volume-2:/var/lib/postgresql/data -d postgres

// postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
// postgresql://myuser:mysecretpassword@localhost:5432/mydatabase
// postgresql://harsh:mypassword@postgres-container-2:5432/ytclone

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { channels: { select: { id: true } } },
  });
  appAssert(user, NOT_FOUND, "User not found");

  const removedPassword = { ...user, password: undefined };

  return res.status(OK).json(removedPassword);
});

export const updateProfileHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const result = updateUserProfileSchema.safeParse(req.body);

  if (!userId) {
    return res.status(UNAUTHORIZED).json({ error: "Unauthorized" });
  }

  if (!result.success) {
    return res.status(BAD_REQUEST).json({ error: "Invalid input" });
  }

  const avatarLocalPath = req.file?.path; // Assuming req.file is used for a single file

  const { username, bio } = result.data;

  const updatedUser = await updateUserProfile(
    userId,
    username,
    avatarLocalPath,
    bio
  );

  return res.status(OK).json(updatedUser);
});

export const checkUsernameHandler = catchErrors(async (req, res) => {
  try {
    const { username } = req.params;
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    res.json({ isAvailable: !existingUser });
  } catch (error) {
    console.error("Error checking username:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
