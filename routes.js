// auth: https://hapi.dev/tutorials/auth/?lang=en_US

import { mainController } from './src/controllers/main-controller.js';
import { accountController } from './src/controllers/accounts-controller.js';
import { testController } from './src/controllers/test-controller.js';
import { actionsController } from './src/controllers/actions-controller.js';


export const routes = [
    // pages
    { method: 'GET', path: '/', config: mainController.index },
    { method: 'GET', path: '/about', config: mainController.about },
    { method: 'GET', path: '/map', config: mainController.map },
    { method: 'GET', path: '/account', config: mainController.account },
    { method: 'GET', path: '/point', config: mainController.point },
    { method: 'GET', path: '/users', config: mainController.users },
    { method: 'GET', path: '/user/{uid}/delete', config: actionsController.deleteUser },
    { method: 'POST', path: '/user/{uid}/edit', config: actionsController.editUser },
    { method: 'GET', path: '/user', config: mainController.user },
    { method: 'GET', path: '/my-points', config: mainController.myPoints },
    { method: 'GET', path: '/my-collections', config: mainController.myCollections },
    { method: 'GET', path: '/collections/{id}', config: mainController.collection },
    { method: 'GET', path: '/my-categories', config: mainController.myCategories },
    { method: 'GET', path: '/my-items', config: mainController.myItems },
    { method: 'GET', path: '/items/{id}', config: mainController.item },

    // account pages
    { method: 'GET', path: '/login', config: accountController.login },
    { method: 'GET', path: '/signup', config: accountController.signup },
    
    // account actions
    { method: 'POST', path: '/signup/submit', config: accountController.signupSubmit },
    { method: 'POST', path: '/login/submit', config: accountController.loginSubmit },
    { method: 'GET', path: '/logout', config: accountController.logout },
    
    // actions
    { method: 'POST', path: '/addApiToAccount', config: actionsController.addApiKey },
    { method: 'POST', path: '/map/add-point/submit', config: actionsController.addPoint },
    { method: 'POST', path: '/items/create-item', config: actionsController.createItem },
    { method: 'POST', path: '/items/{id}/edit', config: actionsController.editItem },
    { method: 'GET', path: '/items/{id}/delete', config: actionsController.deleteItem },
    { method: 'POST', path: '/collections/create', config: actionsController.createCollection },
    { method: 'POST', path: '/collections/{id}/edit', config: actionsController.editCollection },
    { method: 'GET', path: '/collections/{id}/delete', config: actionsController.deleteCollection },

    // points
    { method: 'POST', path: '/point/uploadImage', config: actionsController.uploadPointImage },
    { method: 'POST', path: '/items/uploadImage', config: actionsController.uploadItemImage },

    // test
    { method: 'GET', path: '/test', config: testController.test },
    { method: 'POST', path: '/test/submit', config: testController.testSubmit },
];