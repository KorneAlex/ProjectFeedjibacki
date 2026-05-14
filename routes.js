// auth: https://hapi.dev/tutorials/auth/?lang=en_US

import { mainController } from './src/controllers/main-controller.js';
import { accountController } from './src/controllers/accounts-controller.js';
import { testController } from './src/controllers/test-controller.js';
import { actionsController } from './src/controllers/actions-controller.js';


export const routes = [
    // pages
    { method: 'GET', path: '/', config: mainController.index },
    { method: 'GET', path: '/about', config: mainController.about },
    { method: 'GET', path: '/dashboard', config: mainController.dashboard },
    { method: 'GET', path: '/account', config: mainController.account },
    { method: 'GET', path: '/point', config: mainController.point },
    { method: 'GET', path: '/users', config: mainController.users },
    { method: 'GET', path: '/user/{uid}/delete', config: actionsController.deleteUser },
    { method: 'GET', path: '/user', config: mainController.user },
    { method: 'GET', path: '/my-points', config: mainController.myPoints },

    // account pages
    { method: 'GET', path: '/login', config: accountController.login },
    { method: 'GET', path: '/signup', config: accountController.signup },
    
    // account actions
    { method: 'POST', path: '/signup/submit', config: accountController.signupSubmit },
    { method: 'POST', path: '/login/submit', config: accountController.loginSubmit },
    { method: 'GET', path: '/logout', config: accountController.logout },
    
    // actions
    { method: 'POST', path: '/addApiToAccount', config: actionsController.addApiKey },
    { method: 'POST', path: '/dashboard/add-point/submit', config: actionsController.addPoint },

    // points
    { method: 'POST', path: '/point/uploadImage', config: actionsController.uploadPointImage },

    // test
    { method: 'GET', path: '/test', config: testController.test },
    { method: 'POST', path: '/test/submit', config: testController.testSubmit },
];