import superagent from 'superagent'

import { userSvcAuthority, UserSvcPing } from 'authorities'

export class IndexModel {
    /**
     * get the number of active sessions
     * @returns the number of active sessions
     */
    public static async getSessions(): Promise<number> {
        try {
            const res: superagent.Response = await superagent
                .get('http://' + userSvcAuthority() + '/ping')
                .accept('json')

            return res.status === 200 ? res.body.sessions : 0
        } catch (error) {
            UserSvcPing.checkNow()
            throw error
        }
    }
}
