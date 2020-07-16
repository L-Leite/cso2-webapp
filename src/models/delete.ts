import { UsersService } from 'services/usersservice'

export class DeleteUserModel {
    /**
     * delete an user by its ID
     * @param userId the user's to be deleted ID
     * @returns true if deleted successfully, false if not
     */
    public static async delete(userId: number): Promise<boolean> {
        return await UsersService.delete(userId)
    }
}
