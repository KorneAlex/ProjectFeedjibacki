// auth: https://hapi.dev/tutorials/auth/?lang=en_US

import { mainController } from './src/controllers/main-controller.js';
import { accountController } from './src/controllers/accounts-controller.js';
import { testController } from './src/controllers/test-controller.js';
import { actionsController } from './src/controllers/actions-controller.js';


export const routes = [
    // pages
    { method: 'GET', path: '/', handler: mainController.index, options: { auth: { mode: 'try' } } },
    { method: 'GET', path: '/about', handler: mainController.about, options: { auth: { mode: 'try' } } },
    { method: 'GET', path: '/dashboard', handler: mainController.dashboard },
    { method: 'GET', path: '/account', handler: mainController.account },
    { method: 'GET', path: '/point', handler: mainController.point },
    { method: 'GET', path: '/users', handler: mainController.users },
    { method: 'GET', path: '/user/{uid}/delete', config: actionsController.deleteUser },
    { method: 'GET', path: '/user', handler: mainController.user },
    { method: 'GET', path: '/my-points', handler: mainController.myPoints },

    // account pages
    { method: 'GET', path: '/login', config: accountController.login },
    { method: 'GET', path: '/signup', config: accountController.signup },
    
    // account actions
    // { method: 'POST', path: '/signup/submit', handler: accountController.signupSubmit.handler, options: accountController.signupSubmit.options },
    { method: 'POST', path: '/signup/submit', config: accountController.signupSubmit },
    { method: 'POST', path: '/login/submit', config: accountController.loginSubmit },
    { method: 'GET', path: '/logout', config: accountController.logout },
    
    // actions
    { method: 'POST', path: '/addApiToAccount', config: actionsController.addApiKey },
    { method: 'POST', path: '/dashboard/add-point/submit', config: actionsController.addPoint },

    // points
    { method: 'POST', path: '/point/uploadImage', config: actionsController.uploadPointImage },

    // test
    { method: 'GET', path: '/test', handler: testController.test, options: { auth: { mode: "try"} } },
    { method: 'POST', path: '/test/submit', handler: testController.testSubmit.handler, options: testController.testSubmit.options },
];