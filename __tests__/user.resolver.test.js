const { deleteProfilePicture } = require('../../graphql/resolvers/user');
const { User } = require('../../database/models');

jest.mock('../../database/models');
const mockDeleteProfilePictureFromSpaces = jest.fn();
jest.mock('../../services/digitalocean', () => ({
  deleteProfilePictureFromSpaces: (...args) => mockDeleteProfilePictureFromSpaces(...args),
}));

describe('deleteProfilePicture', () => {
  const defaultAvatar = 'https://neeucomdos.sfo2.cdn.digitaloceanspaces.com/default-avatar.webp';
  const userId = 'test-user-id';
  const user = { id: userId };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe borrar la foto personalizada y poner el avatar por defecto', async () => {
    User.findOne.mockResolvedValueOnce({
      id: userId,
      profilePicture: 'https://neeucomdos.sfo2.cdn.digitaloceanspaces.com/userProfilePictures/user_test-user-id/profile_picture_1.jpg',
    });
    User.update = jest.fn().mockResolvedValueOnce([1]);
    User.findOne.mockResolvedValueOnce({ id: userId, profilePicture: defaultAvatar });
    mockDeleteProfilePictureFromSpaces.mockResolvedValueOnce();

    const result = await deleteProfilePicture(null, {}, { user });
    expect(mockDeleteProfilePictureFromSpaces).toHaveBeenCalled();
    expect(User.update).toHaveBeenCalledWith({ profilePicture: defaultAvatar }, { where: { id: userId } });
    expect(result.profilePicture).toBe(defaultAvatar);
  });

  it('no debe intentar borrar si ya es el avatar por defecto', async () => {
    User.findOne.mockResolvedValueOnce({ id: userId, profilePicture: defaultAvatar });
    User.update = jest.fn().mockResolvedValueOnce([1]);
    User.findOne.mockResolvedValueOnce({ id: userId, profilePicture: defaultAvatar });

    const result = await deleteProfilePicture(null, {}, { user });
    expect(mockDeleteProfilePictureFromSpaces).not.toHaveBeenCalled();
    expect(User.update).toHaveBeenCalledWith({ profilePicture: defaultAvatar }, { where: { id: userId } });
    expect(result.profilePicture).toBe(defaultAvatar);
  });
});
