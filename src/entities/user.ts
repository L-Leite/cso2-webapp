import LRU from 'lru-cache'
import superagent from 'superagent'

import { userSvcAuthority, UserSvcPing } from 'authorities'

/**
 * represents an user account
 */
export class User {
    /**
     * create an user
     * @param username the new user's name
     * @param playername the user's ingame player name
     * @param password the user's account password
     * @returns the user ID if created, false if not
     */
    public static async create(username: string, playername: string, password: string): Promise<number> {
        try {
            const res: superagent.Response = await superagent
                .post('http://' + userSvcAuthority() + '/users/')
                .send({
                    username,
                    playername,
                    password,
                })
                .accept('json')

            if (res.status === 201) {
                return res.body.userId
            }

            return null
        } catch (error) {
            UserSvcPing.checkNow()
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
            let session: User = userCache.get(userId)

            if (session != null) {
                return session
            }

            if (UserSvcPing.isAlive() === false) {
                return null
            }

            const res: superagent.Response = await superagent
                .get('http://' + userSvcAuthority() + '/users/' + userId)
                .accept('json')
            if (res.status === 200) {
                // HACK to get methods working
                session = new User()
                Object.assign(session, res.body)
                userCache.set(session.userId, session)
                return session
            }

            return null
        } catch (error) {
            UserSvcPing.checkNow()
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
                .get('http://' + userSvcAuthority() + '/users/byname/' + userName)
                .accept('json')

            if (res.status === 200) {
                // HACK to get, methods working
                const newBody: User = new User()
                Object.assign(newBody, res.body)
                return newBody
            }

            return null
        } catch (error) {
            UserSvcPing.checkNow()
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
                .delete('http://' + userSvcAuthority() + '/users/' + userId)
                .accept('json')
            return res.status === 200
        } catch (error) {
            UserSvcPing.checkNow()
            throw error
        }
    }

    public userId: number
    public userName: string
    public password: string
    public playerName: string
    public level: number
    public avatar: number
    public curExp: number
    public maxExp: number
    public rank: number
    public vipLevel: number
    public wins: number
    public kills: number
    public deaths: number
    public assists: number

    /**
     * is the user a VIP?
     * @returns true if so, false if not
     */
    public isVip(): boolean {
        return this.vipLevel !== 0
    }
}

const userCache = new LRU<number, User>({ max: 100, maxAge: 1000 * 15 })
