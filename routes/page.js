exports.login = function (request, response) {
    response.render('pages/login');
};

exports.index = function (request, response) {
    response.render('pages/index');
};

exports.profile = function (request, response) {
    response.render('pages/profile');
};

exports.background = function (request, response) {
    response.render('pages/background');
}