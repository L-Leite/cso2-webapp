import { HashContainer } from 'hash'
import { User } from 'entities/user'
import { UsersService } from 'services/usersservice'

export class LoginModel {
    /**
     * validates an user's credentials
     * @param username the user's name
     * @param password the user's password
     * @returns the user's ID if the credentials are valid, null if they're not
     */
    public static async validateCreds(
        username: string,
        password: string
    ): Promise<number> {
        const user: User = await UsersService.getByName(username)

        if (user == null) {
            return null
        }

        const hashedInPass = await HashContainer.create(password)

        // clear plain password
        password = null

        const hashedStorePass = HashContainer.from(user.password)

        return hashedInPass.compare(hashedStorePass) === true
            ? user.userId
            : null
    }
}
