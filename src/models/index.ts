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
                .get(`http://${userSvcAuthority()}/ping`)
                .accept('json')

            if (res.ok === false) {
                return 0
            }

            const typedBody = res.body as { sessions: number }
            return typedBody.sessions
        } catch (error) {
            await UserSvcPing.checkNow()
            throw error
        }
    }
}
