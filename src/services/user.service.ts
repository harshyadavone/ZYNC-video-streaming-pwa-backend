import { PrismaClient } from '@prisma/client';
import { User } from '@prisma/client';
import appAssert from '../utils/appAssert';
import { NOT_FOUND } from '../constants/http';
import { uploadOnCloudinary } from '../utils/cloudinary';

const prisma = new PrismaClient();

export const updateUserProfile = async (
  userId: number,
  username?: string,
  avatarLocalPath?: string,
  bio?: string
): Promise<Partial<User>> => {

  if (!username && !avatarLocalPath && !bio) {
    throw new Error('No fields to update');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  appAssert(user, NOT_FOUND, 'User not found');

  if (username && username !== user.username) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      throw new Error('Username is already taken');
    }
  }

  let avatarUrl: any;
  if (avatarLocalPath) {
    avatarUrl = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarUrl) {
      throw new Error('Failed to upload avatar');
    }
  }

  // console.log(avata)

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username: username || undefined,
      avatar: avatarUrl?.url || undefined,
      bio: bio || undefined,
    },
  });

  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

