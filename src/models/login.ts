import { User } from 'entities/user'
import { comparePasswordHashes } from 'hash'

export class LoginModel {
    /**
     * validates an user's credentials
     * @param username the user's name
     * @param password the user's password
     * @returns the user's ID if the credentials are valid, null if they're not
     */
    public static async validateCreds(username: string, password: string): Promise<number> {
        const user: User = await User.getByName(username)

        if (user == null) {
            return null
        }

        return await comparePasswordHashes(password, user.password) === true ? user.userId : null
    }
}
