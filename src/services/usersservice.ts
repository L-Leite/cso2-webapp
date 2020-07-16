import LRU from 'lru-cache'
import superagent from 'superagent'

import { userSvcAuthority, UserSvcPing } from 'authorities'
import { User } from 'entities/user'

/**
 * represents an user account
 */
export class UsersService {
    /**
     * create an user
     * @param username the new user's name
     * @param playername the user's ingame player name
     * @param password the user's account password
     * @returns the user ID if created, false if not
     */
    public static async create(
        username: string,
        playername: string,
        password: string
    ): Promise<User> {
        try {
            const res: superagent.Response = await superagent
                .post(`http://${userSvcAuthority()}/users/`)
                .send({
                    username,
                    playername,
                    password
                })
                .accept('json')

            if (res.status !== 201) {
                return null
            }

            return res.body as User
        } catch (error) {
            await UserSvcPing.checkNow()
            throw error
        }
    }

    /**
     * get an user's by its ID
     * @param userId the user's ID
     * @returns the user object if found, null otherwise
     */
    public static async get(userId: number): Promise<User> {
        try {
            let foundUser: User = userCache.get(userId)

            if (foundUser != null) {
                return foundUser
            }

            if (UserSvcPing.isAlive() === false) {
                return null
            }

            const res: superagent.Response = await superagent
                .get(`http://${userSvcAuthority()}/users/${userId}`)
                .accept('json')

            if (res.status !== 200) {
                return null
            }

            // HACK to get methods working
            foundUser = new User()
            Object.assign(foundUser, res.body)
            userCache.set(foundUser.id, foundUser)
            return foundUser
        } catch (error) {
            await UserSvcPing.checkNow()
            throw error
        }
    }

    /**
     * get an user's by its name
     * @param userName the target's user name
     */
    public static async getByName(userName: string): Promise<User> {
        try {
            if (UserSvcPing.isAlive() === false) {
                return null
            }

            const res: superagent.Response = await superagent
                .get(`http://${userSvcAuthority()}/users/byname/${userName}`)
                .accept('json')

            if (res.status !== 200) {
                return null
            }

            // HACK to get, methods working
            const foundUser: User = new User()
            Object.assign(foundUser, res.body)
            userCache.set(foundUser.id, foundUser)
            return foundUser
        } catch (error) {
            await UserSvcPing.checkNow()
            throw error
        }
    }

    /**
     * delete an user
     * @param userId the user's to be deleted ID
     * @returns true if deleted successfully, false if not
     */
    public static async delete(userId: number): Promise<boolean> {
        try {
            const res: superagent.Response = await superagent
                .delete(`http://${userSvcAuthority()}/users/${userId}`)
                .accept('json')
            return res.status === 200
        } catch (error) {
            await UserSvcPing.checkNow()
            throw error
        }
    }

    /**
     * validates an user's credentials
     * @param username the user's name
     * @param password the user's password
     * @returns true if the credentials are valid, false if not
     */
    public static async validate(
        username: string,
        password: string
    ): Promise<boolean> {
        try {
            const res: superagent.Response = await superagent
                .post(`http://${userSvcAuthority()}/users/auth/validate`)
                .send({
                    username,
                    password
                })
                .accept('json')

            return res.status === 200
        } catch (error) {
            await UserSvcPing.checkNow()
            throw error
        }
}

const userCache = new LRU<number, User>({ max: 100, maxAge: 1000 * 15 })
