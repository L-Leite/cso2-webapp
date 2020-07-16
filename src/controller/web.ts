import express from 'express'

import { LogInstance } from 'log/loginstance'

import { DeleteUserModel } from 'models/delete'
import { LoginModel } from 'models/login'
import { SignupModel } from 'models/signup'

import { User } from 'entities/user'
import { MapImageList } from 'maps'
import { IndexModel } from 'models'

/**
 * handles requests to /
 */
export class WebController {
    /**
     * setup the controller's routes
     * @param app the server's express instance
     */
    public static setup(app: express.Express) {
        app.route('/').get(this.OnGetIndex)
        app.route('/signup').get(this.OnGetSignup)
        app.route('/login').get(this.OnGetLogin)
        app.route('/logout').get(this.OnGetLogout)
        app.route('/user').get(this.OnGetUser)
        app.route('/user/delete').get(this.OnGetUserDelete)
        app.route('/do_signup').post(this.OnPostDoSignup)
        app.route('/do_login').post(this.OnPostDoLogin)
        app.route('/do_delete').post(this.OnPostDoDelete)
    }

    /**
     * redirect to a page with an error message set in the session
     * @param error the error message
     * @param redirPage the page to redirect the user to
     * @param req the user's request object
     * @param res the response object to the user
     */
    private static redirectWithError(
        error: string,
        redirPage: string,
        req: express.Request,
        res: express.Response
    ): void {
        req.session.error = error
        return res.redirect(redirPage)
    }

    /**
     * clean up an user's session status and error messages
     * @param req the user's request
     */
    private static cleanUpStatus(req: express.Request): void {
        req.session.status = null
        req.session.error = null
        req.session.save((err) => {
            if (err) {
                throw err
            }
        })
    }

    /**
     * called when a GET request to / is done
     * renders the index page
     * @param req the request data
     * @param res the response data
     */
    private static async OnGetIndex(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        if (req.session.userId != null) {
            return res.redirect('/user')
        }

        const sessions: number = await IndexModel.getSessions()

        res.render('index', {
            playersOnline: sessions,
            mapImage: MapImageList.getRandomFile(),
            status: req.session.status,
            error: req.session.error
        })

        WebController.cleanUpStatus(req)
    }

    /**
     * called when a GET request to /signup is done
     * renders the signup page
     * @param req the request data
     * @param res the response data
     */
    private static async OnGetSignup(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        if (req.session.userId != null) {
            return res.redirect('/user')
        }

        res.render('signup', {
            mapImage: MapImageList.getRandomFile(),
            status: req.session.status,
            error: req.session.error
        })

        WebController.cleanUpStatus(req)
    }

    /**
     * called when a GET request to /login is done
     * renders the login page
     * @param req the request data
     * @param res the response data
     */
    private static async OnGetLogin(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        if (req.session.userId != null) {
            return res.redirect('/user')
        }

        res.render('login', {
            mapImage: MapImageList.getRandomFile(),
            status: req.session.status,
            error: req.session.error
        })

        WebController.cleanUpStatus(req)
    }

    /**
     * called when a GET request to /logout is done
     * deletes the userId in session and redirects to the /login page
     * @param req the request data
     * @param res the response data
     */
    private static async OnGetLogout(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        if (req.session.userId != null) {
            req.session.userId = null
        }

        req.session.status = 'Logged out succesfully.'

        req.session.save((err) => {
            if (err) {
                throw err
            }
        })

        res.redirect('/user')
    }

    /**
     * called when a GET request to /user is done
     * renders the user's info page
     * @param req the request data
     * @param res the response data
     */
    private static async OnGetUser(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        if (req.session.userId == null) {
            return res.redirect('/login')
        }

        const user: User = await User.get(req.session.userId)

        res.render('user', {
            user,
            mapImage: MapImageList.getRandomFile(),
            status: req.session.status,
            error: req.session.error
        })

        WebController.cleanUpStatus(req)
    }

    /**
     * called when a GET request to /user/delete is done
     * renders the user's info page
     * @param req the request data
     * @param res the response data
     */
    private static async OnGetUserDelete(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        if (req.session.userId == null) {
            return res.redirect('/login')
        }

        const user: User = await User.get(req.session.userId)

        res.render('delete', {
            user,
            mapImage: MapImageList.getRandomFile(),
            status: req.session.status,
            error: req.session.error
        })

        WebController.cleanUpStatus(req)
    }

    /**
     * called when a POST request to /do_signup is done
     * creates a new user account
     * @param req the request data
     * @param res the response data
     */
    private static async OnPostDoSignup(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        if (req.session.userId != null) {
            return res.redirect('/user')
        }

        const userName: string = req.body.username
        const playerName: string = req.body.playername
        const password: string = req.body.password
        const confirmedPassword: string = req.body.confirmed_password

        if (
            userName == null ||
            playerName == null ||
            password == null ||
            confirmedPassword == null
        ) {
            return WebController.redirectWithError(
                'A bad request was made.',
                '/signup',
                req,
                res
            )
        }

        if (password !== confirmedPassword) {
            return WebController.redirectWithError(
                'The passwords are not the same.',
                '/signup',
                req,
                res
            )
        }

        try {
            const newUserId: number = await SignupModel.createUser(
                userName,
                playerName,
                password
            )

            if (newUserId) {
                req.session.userId = newUserId
                req.session.save((err) => {
                    if (err) {
                        throw err
                    }
                })

                return res.redirect('/user')
            }

            WebController.redirectWithError(
                'Bad credentials',
                '/signup',
                req,
                res
            )
        } catch (error) {
            if (error) {
                const errorMessage: string = error.toString()
                LogInstance.error(errorMessage)
                WebController.redirectWithError(
                    errorMessage,
                    '/signup',
                    req,
                    res
                )
            }
        }
    }

    /**
     * called when a POST request to /do_login is done
     * logs in to an user's account
     * @param req the request data
     * @param res the response data
     */
    private static async OnPostDoLogin(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        if (req.session.userId != null) {
            return res.redirect('/user')
        }

        const username: string = req.body.username
        const password: string = req.body.password

        if (username == null || password == null) {
            return WebController.redirectWithError(
                'A bad request was made.',
                '/login',
                req,
                res
            )
        }

        try {
            const authedUserId: number = await LoginModel.validateCreds(
                username,
                password
            )

            if (authedUserId) {
                req.session.userId = authedUserId
                req.session.save((err) => {
                    if (err) {
                        throw err
                    }
                })

                return res.redirect('/user')
            }

            WebController.redirectWithError(
                'Bad credentials',
                '/login',
                req,
                res
            )
        } catch (error) {
            if (error) {
                let errorMessage: string = null

                if (error.status === 404) {
                    errorMessage = 'User was not found'
                } else {
                    errorMessage = error.toString()
                }

                LogInstance.error(errorMessage)
                WebController.redirectWithError(
                    errorMessage,
                    '/login',
                    req,
                    res
                )
            }
        }
    }

    /**
     * called when a POST request to /do_delete is done
     * delete's an user's account
     * @param req the request data
     * @param res the response data
     */
    private static async OnPostDoDelete(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        const targetUserId: number = req.session.userId

        if (targetUserId == null) {
            return res.redirect('/login')
        }

        const confirmation: string = req.body.confirmation

        if (confirmation !== 'on') {
            return WebController.redirectWithError(
                'The user did not tick the confirmation box',
                '/user/delete',
                req,
                res
            )
        }

        try {
            const deleted: boolean = await DeleteUserModel.delete(targetUserId)

            if (deleted) {
                req.session.userId = null
                req.session.status = 'Account deleted successfully.'

                req.session.save((err) => {
                    if (err) {
                        throw err
                    }
                })

                return res.redirect('/login')
            }

            WebController.redirectWithError(
                'Failed to delete account.',
                '/user',
                req,
                res
            )
        } catch (error) {
            if (error) {
                const errorMessage: string = error.toString()
                LogInstance.error(errorMessage)
                WebController.redirectWithError(
                    errorMessage,
                    '/signup',
                    req,
                    res
                )
            }
        }
    }
}
